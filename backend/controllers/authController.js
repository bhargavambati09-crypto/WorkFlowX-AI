const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { registerSchema, loginSchema } = require('../validators/schemas');

/**
 * Checks if a name is an invalid placeholder from legacy bugs.
 */
const isPlaceholderName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const n = name.trim().toLowerCase();
  return (
    n === '' ||
    n === 'google user' ||
    n === 'operator' ||
    n === 'test user' ||
    n === 'admin' ||
    n === 'administrator' ||
    n === 'user' ||
    n === 'null' ||
    n === 'undefined'
  );
};

/**
 * Clean and format an email username into a human name.
 * e.g., "divya.gunda@gmail.com" -> "Divya Gunda"
 *       "john_doe@company.com"  -> "John Doe"
 */
const formatEmailUsername = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;
  const username = email.split('@')[0].trim();
  if (!username) return null;
  // Ignore purely generated machine emails like google.1234
  if (/^google[._-]?\d*$/i.test(username)) return null;

  const parts = username.replace(/[._-]+/g, ' ').trim().split(/\s+/);
  if (!parts.length || !parts[0]) return null;

  const formatted = parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');

  return isPlaceholderName(formatted) ? null : formatted;
};

/**
 * Safely extracts authentic user name using strict priority:
 * 1. user.user_metadata.full_name / full_name
 * 2. user.user_metadata.name / name
 * 3. user.user_metadata.display_name / displayName
 * 4. email username (capitalized)
 * 5. "User"
 * NEVER returns "Google User" or "operator".
 */
const extractActualName = (body = {}, tokenPayload = {}) => {
  const meta = body.user_metadata || body.raw_user_meta_data || body.metadata || body.user?.user_metadata || {};

  // 1. full_name
  const fullName = meta.full_name || body.full_name || body.fullName || tokenPayload.name || tokenPayload.full_name;
  if (fullName && !isPlaceholderName(fullName)) return fullName.trim();

  // 2. name
  const name = meta.name || body.name || body.user?.name;
  if (name && !isPlaceholderName(name)) return name.trim();

  // 3. display_name / displayName
  const displayName = meta.display_name || body.displayName || body.display_name;
  if (displayName && !isPlaceholderName(displayName)) return displayName.trim();

  // 3b. given_name + family_name
  const given = meta.given_name || body.given_name || tokenPayload.given_name;
  const family = meta.family_name || body.family_name || tokenPayload.family_name;
  if (given) {
    const combined = family ? `${given} ${family}`.trim() : given.trim();
    if (!isPlaceholderName(combined)) return combined;
  }

  // 4. email username
  const email = tokenPayload.email || body.email || meta.email || body.user?.email;
  const emailName = formatEmailUsername(email);
  if (emailName) return emailName;

  // 5. Safe fallback
  return 'User';
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if email exists
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('email', email.trim().toLowerCase()).single();
    
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Clean name: never store placeholder or role as name
    const cleanName = !isPlaceholderName(name)
      ? name.trim()
      : (formatEmailUsername(email) || 'User');

    // Create user with explicit role separation
    const { data: user, error } = await supabase
      .from('profiles')
      .insert({
        name: cleanName,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        role: 'user', // Role kept strictly separate
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error) throw error;

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('profiles').select('*').eq('email', normalizedEmail).single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-heal legacy accounts that were contaminated with placeholder names
    if (isPlaceholderName(user.name)) {
      const healedName = formatEmailUsername(user.email) || 'User';
      if (healedName && healedName !== user.name) {
        await supabase
          .from('profiles')
          .update({ name: healedName })
          .eq('id', user.id);
        user.name = healedName;
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    let tokenPayload = {};
    if (req.body.credential && typeof req.body.credential === 'string') {
      try {
        const decoded = jwt.decode(req.body.credential);
        if (decoded && typeof decoded === 'object') {
          tokenPayload = decoded;
        }
      } catch (_) {}
    }

    const email = (
      tokenPayload.email ||
      req.body.email ||
      req.body.user_metadata?.email ||
      req.body.user?.email ||
      ''
    ).trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Google account email is required' });
    }

    // Extract actual name from Google metadata or credential
    const actualName = extractActualName(req.body, tokenPayload);

    // Check if user profile already exists in profiles table
    let { data: user } = await supabase
      .from('profiles').select('*').eq('email', email).single();

    if (!user) {
      // Create user automatically via Google Sign-up with real name
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const { data: newUser, error } = await supabase
        .from('profiles')
        .insert({
          name: actualName,
          email,
          password_hash: passwordHash,
          role: 'user', // Role kept strictly separate from name
        })
        .select('id, name, email, role, created_at')
        .single();

      if (error) throw error;
      user = newUser;
    } else {
      // Existing user:
      // If user currently has a placeholder name ("Google User", "operator", "User"),
      // OR if authentic Google metadata provides a real full name:
      const hasExplicitGoogleName = Boolean(
        (tokenPayload.name && !isPlaceholderName(tokenPayload.name)) ||
        (req.body.user_metadata?.full_name && !isPlaceholderName(req.body.user_metadata.full_name)) ||
        (req.body.name && !isPlaceholderName(req.body.name))
      );

      if ((isPlaceholderName(user.name) || hasExplicitGoogleName) && !isPlaceholderName(actualName)) {
        if (user.name !== actualName) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ name: actualName })
            .eq('id', user.id)
            .select('id, name, email, role, created_at')
            .single();
          if (updated) {
            user = updated;
          } else {
            user.name = actualName;
          }
        }
      }
    }

    // Issue JWT token identifying user by stable userId
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google authentication successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || isPlaceholderName(name)) {
      return res.status(400).json({ error: 'A valid real name is required' });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', req.user.id)
      .select('id, name, email, role')
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user: updated || { ...req.user, name: name.trim() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, getMe, updateMe };
