const supabase = require('../config/supabase');

/**
 * Workflow Event Model
 * Maps to 'workflow_events' table in Supabase PostgreSQL
 * Fields: id, workflow_id, event_type, actor_type, actor_name, message, metadata, created_at
 */
class WorkflowEvent {
  static async findById(id) {
    const { data, error } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByWorkflow(workflowId, { limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async create({ workflowId, workflow_id, eventType, event_type, actorType, actor_type, actorName, actor_name, message, metadata = {} }) {
    const record = {
      workflow_id: workflowId || workflow_id,
      event_type: eventType || event_type,
      actor_type: actorType || actor_type || 'System',
      actor_name: actorName || actor_name || 'Workflow Engine',
      message,
      metadata: typeof metadata === 'object' ? metadata : {},
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('workflow_events')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = WorkflowEvent;
