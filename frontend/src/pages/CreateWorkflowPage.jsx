import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI } from '../services/api';
import { TopBar } from '../components/layout/Sidebar';
import { toast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/index.jsx';
import { GitBranch, Brain, Calendar, Building } from 'lucide-react';

const CreateWorkflowPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', department: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = ['Finance', 'IT Operations', 'Customer Support', 'Supply Chain', 'HR', 'Marketing', 'Operations', 'Management', 'Legal', 'General'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.description.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        department: form.department || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      const res = await workflowAPI.create(payload);
      const wf = res.data.workflow || res.data.data;
      const wfId = wf.id;
      toast.success('Workflow created! Starting AI analysis...');
      
      // Auto-trigger analysis
      try {
        await workflowAPI.analyze(wfId);
        toast.success('AI analysis complete! Tasks generated.');
      } catch (analyzeErr) {
        toast.warning('Workflow created. You can trigger analysis manually.');
      }
      
      navigate(`/workflows/${wfId}`);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.details?.[0]?.message || 'Failed to create workflow';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <TopBar
        title="Create Workflow"
        subtitle="Describe your business problem and AI will do the rest"
      />

      <div className="glass-card p-8">
        {/* AI Info Banner */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-brand-400" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">AI-Powered Analysis</div>
            <p className="text-xs text-gray-400 mt-1">
              After creating your workflow, Gemini AI will automatically analyze your problem, classify priority, 
              generate tasks, and assign them to specialized agents. The more detail you provide, 
              the better the AI analysis.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wf-title" className="block text-sm font-medium text-gray-300 mb-2">
              Problem Title <span className="text-red-400">*</span>
            </label>
            <input id="wf-title" type="text" required
              className="input-field"
              placeholder="e.g. Customer Payment Issue - Order Not Created"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">A clear, concise title for the business problem</p>
          </div>

          <div>
            <label htmlFor="wf-desc" className="block text-sm font-medium text-gray-300 mb-2">
              Problem Description <span className="text-red-400">*</span>
            </label>
            <textarea id="wf-desc" rows={6} required
              className="input-field resize-none"
              placeholder="Describe the business problem in detail. Include: what happened, affected systems, customer impact, any transaction IDs or error messages. The more context you provide, the better the AI analysis will be..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Be specific and include all relevant context</span>
              <span className={form.description.length < 10 ? 'text-red-400' : 'text-gray-400 font-mono'}>
                {form.description.length} chars
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="wf-dept" className="block text-sm font-medium text-gray-300 mb-2">
                <Building size={14} className="inline mr-1" />
                Department
              </label>
              <select id="wf-dept"
                className="input-field"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              >
                <option value="">Select department...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="wf-deadline" className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar size={14} className="inline mr-1" />
                Target Resolution Deadline
              </label>
              <input id="wf-deadline" type="datetime-local"
                className="input-field"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" id="create-workflow-btn" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? (
                <><Spinner size={16} /> Analyzing with AI...</>
              ) : (
                <><Brain size={16} /> Analyze with AI</>
              )}
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
              <Spinner size={20} />
              <div>
                <div className="text-sm font-medium text-white">AI is analyzing your problem…</div>
                <div className="text-xs text-gray-500">Orchestrating Analysis → Planning → Coordination agents</div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Example Problems */}
      <div className="glass-card p-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">💡 Sample Problems for Demo</h3>
        <div className="space-y-2">
          {[
            { title: 'Customer Payment Issue', desc: 'A customer was charged for an order, but the order was not created.' },
            { title: 'IT System Outage', desc: 'Production server experiencing intermittent downtime affecting 500 users.' },
            { title: 'Supplier Delay', desc: 'Critical shipment delayed 3 days, impacting 15 enterprise customers.' },
          ].map(ex => (
            <button key={ex.title} onClick={() => setForm(f => ({ ...f, title: ex.title, description: ex.desc }))}
              className="w-full text-left p-3 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all duration-200">
              <div className="text-sm font-medium text-gray-300">{ex.title}</div>
              <div className="text-xs text-gray-400 mt-1">{ex.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateWorkflowPage;
