const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const workflowSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().optional(),
  deadline: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }),
});

const workflowUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['draft', 'analyzing', 'planning', 'ready', 'executing', 'monitoring', 'blocked', 'replanning', 'awaiting_approval', 'completed', 'failed']).optional(),
  department: z.string().optional(),
  deadline: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }),
});

const taskUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'failed']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigned_agent: z.string().optional(),
  description: z.string().optional(),
});

const approvalSchema = z.object({
  notes: z.string().optional(),
});

const uuidSchema = z.string().uuid('Invalid ID format');

const askWorkflowSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerSchema, loginSchema, workflowSchema, workflowUpdateSchema,
  taskUpdateSchema, approvalSchema, uuidSchema, askWorkflowSchema, validate,
};
