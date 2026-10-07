const supabase = require('../config/supabase');

/**
 * Notification Model
 * Maps to 'notifications' table in Supabase PostgreSQL
 * Fields: id, user_id, message, type, read, created_at
 */
class Notification {
  static async findById(id) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByUser(userId, { unreadOnly = false, limit = 50 } = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async create({ userId, user_id, message, type = 'info' }) {
    const record = {
      user_id: userId || user_id,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async markAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async markAllAsRead(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }
}

module.exports = Notification;
