const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { registerSchema, loginSchema } = require('../validators/schemas');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if email exists
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('email', email).single();
    
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('profiles')
      .insert({ name, email, password_hash: passwordHash, role: 'user' })
      .select('id, name, email, role, created_at')
      .single();

    if (error) throw error;

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

    const { data: user, error } = await supabase
      .from('profiles').select('*').eq('email', email).single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google account email is required' });
    }

    // Check if user profile already exists
    let { data: user } = await supabase
      .from('profiles').select('*').eq('email', email).single();

    if (!user) {
      // Create user automatically via Google Sign-up
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const displayName = name || email.split('@')[0];

      const { data: newUser, error } = await supabase
        .from('profiles')
        .insert({
          name: displayName,
          email,
          password_hash: passwordHash,
          role: 'user',
        })
        .select('id, name, email, role, created_at')
        .single();

      if (error) throw error;
      user = newUser;
    }

    // Issue JWT token
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
  res.json({ user: req.user });
};

module.exports = { register, login, googleAuth, getMe };
