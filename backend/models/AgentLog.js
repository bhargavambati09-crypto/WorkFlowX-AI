const supabase = require('../config/supabase');

/**
 * Agent Log Model
 * Maps to 'agent_logs' table in Supabase PostgreSQL
 * Fields: id, workflow_id, agent_name, action, status, summary, confidence, timestamp
 */
class AgentLog {
  static async findById(id) {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByWorkflow(workflowId, { limit = 100 } = {}) {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async create({ workflowId, workflow_id, agentName, agent_name, action, status = 'completed', summary, confidence = 0.9 }) {
    const record = {
      workflow_id: workflowId || workflow_id,
      agent_name: agentName || agent_name,
      action,
      status,
      summary,
      confidence: typeof confidence === 'number' ? confidence : 0.9,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agent_logs')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getRecentLogs({ limit = 20 } = {}) {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

module.exports = AgentLog;
