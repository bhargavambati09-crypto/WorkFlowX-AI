const supabase = require('../config/supabase');

/**
 * Task Model
 * Maps to 'tasks' table in Supabase PostgreSQL
 * Fields: id, workflow_id, title, description, assigned_agent, priority, status,
 *         dependencies, requires_approval, deadline, estimated_duration,
 *         created_at, updated_at
 */
class Task {
  static async findById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByWorkflow(workflowId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(payload) {
    const record = {
      workflow_id: payload.workflowId || payload.workflow_id,
      title: payload.title,
      description: payload.description || '',
      assigned_agent: payload.assignedAgent || payload.assigned_agent || 'Operations Agent',
      priority: payload.priority || 'MEDIUM',
      status: payload.status || 'pending',
      dependencies: Array.isArray(payload.dependencies) 
        ? JSON.stringify(payload.dependencies) 
        : (payload.dependencies || '[]'),
      requires_approval: Boolean(payload.requiresApproval ?? payload.requires_approval),
      deadline: payload.deadline || null,
      estimated_duration: payload.estimatedDuration ?? payload.estimated_duration ?? 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async insertMany(tasksArray) {
    const records = tasksArray.map(t => ({
      workflow_id: t.workflowId || t.workflow_id,
      title: t.title,
      description: t.description || '',
      assigned_agent: t.assignedAgent || t.assigned_agent || 'Operations Agent',
      priority: t.priority || 'MEDIUM',
      status: t.status || 'pending',
      dependencies: Array.isArray(t.dependencies) ? JSON.stringify(t.dependencies) : (t.dependencies || '[]'),
      requires_approval: Boolean(t.requiresApproval ?? t.requires_approval),
      deadline: t.deadline || null,
      estimated_duration: t.estimatedDuration ?? t.estimated_duration ?? 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert(records)
      .select();
    if (error) throw error;
    return data || [];
  }

  static async update(id, updates) {
    const fields = { ...updates, updated_at: new Date().toISOString() };
    if (fields.assignedAgent !== undefined) {
      fields.assigned_agent = fields.assignedAgent;
      delete fields.assignedAgent;
    }
    if (fields.requiresApproval !== undefined) {
      fields.requires_approval = fields.requiresApproval;
      delete fields.requiresApproval;
    }
    if (fields.estimatedDuration !== undefined) {
      fields.estimated_duration = fields.estimatedDuration;
      delete fields.estimatedDuration;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }
}

module.exports = Task;
