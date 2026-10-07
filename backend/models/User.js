const supabase = require('../config/supabase');

/**
 * User / Profile Model
 * Maps to 'profiles' table in Supabase PostgreSQL
 * Fields: id, name, email, password_hash, role, created_at
 */
class User {
  static async findById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async create({ name, email, passwordHash, role = 'user' }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        created_at: new Date().toISOString(),
      })
      .select('id, name, email, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const allowed = {};
    if (updates.name) allowed.name = updates.name.trim();
    if (updates.role) allowed.role = updates.role;
    if (updates.passwordHash) allowed.password_hash = updates.passwordHash;

    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', id)
      .select('id, name, email, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  static async list({ limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

module.exports = User;
