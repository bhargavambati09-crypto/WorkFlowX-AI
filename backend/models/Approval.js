const supabase = require('../config/supabase');

/**
 * Approval Model
 * Maps to 'approvals' table in Supabase PostgreSQL
 * Fields: id, workflow_id, task_id, action, reason, ai_recommendation,
 *         risk_level, status, approved_by, created_at, updated_at
 */
class Approval {
  static async findById(id) {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByWorkflow(workflowId) {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async findPending() {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(payload) {
    const record = {
      workflow_id: payload.workflowId || payload.workflow_id,
      task_id: payload.taskId || payload.task_id || null,
      action: payload.action,
      reason: payload.reason || '',
      ai_recommendation: payload.aiRecommendation || payload.ai_recommendation || '',
      risk_level: payload.riskLevel || payload.risk_level || 'MEDIUM',
      status: payload.status || 'pending',
      approved_by: payload.approvedBy || payload.approved_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('approvals')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateStatus(id, { status, approvedBy }) {
    const { data, error } = await supabase
      .from('approvals')
      .update({
        status,
        approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = Approval;
