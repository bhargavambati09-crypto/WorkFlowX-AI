const supabase = require('../config/supabase');

/**
 * Workflow Model
 * Maps to 'workflows' table in Supabase PostgreSQL
 * Fields: id, title, description, department, deadline, category, priority, impact,
 *         status, created_by, ai_analysis, current_step, requires_approval, health_score,
 *         created_at, updated_at
 */
class Workflow {
  static async findById(id) {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByUser(userId, { status, priority, limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async create(payload) {
    const record = {
      title: payload.title,
      description: payload.description,
      department: payload.department || 'General',
      deadline: payload.deadline || null,
      category: payload.category || null,
      priority: payload.priority || 'MEDIUM',
      impact: payload.impact || 'MEDIUM',
      status: payload.status || 'draft',
      created_by: payload.createdBy || payload.created_by,
      ai_analysis: payload.aiAnalysis || payload.ai_analysis || {},
      current_step: payload.currentStep || payload.current_step || 'Initiated',
      requires_approval: Boolean(payload.requiresApproval ?? payload.requires_approval),
      health_score: payload.healthScore ?? payload.health_score ?? 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const fields = { ...updates, updated_at: new Date().toISOString() };
    // Map camelCase to snake_case if present
    if (fields.aiAnalysis !== undefined) {
      fields.ai_analysis = fields.aiAnalysis;
      delete fields.aiAnalysis;
    }
    if (fields.currentStep !== undefined) {
      fields.current_step = fields.currentStep;
      delete fields.currentStep;
    }
    if (fields.requiresApproval !== undefined) {
      fields.requires_approval = fields.requiresApproval;
      delete fields.requiresApproval;
    }
    if (fields.healthScore !== undefined) {
      fields.health_score = fields.healthScore;
      delete fields.healthScore;
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  static async count(userId) {
    let query = supabase.from('workflows').select('id', { count: 'exact' });
    if (userId) query = query.eq('created_by', userId);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }
}

module.exports = Workflow;
