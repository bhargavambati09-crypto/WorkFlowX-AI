import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Brain, GitBranch, Shield, BarChart3, ChevronDown, Bot, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const agents = [
  { name: 'Orchestrator', icon: '🎯', desc: 'Central intelligence. Coordinates all agents and manages workflow state.', color: 'from-brand-500 to-purple-600' },
  { name: 'Analysis Agent', icon: '🔍', desc: 'Analyzes business problems. Classifies priority, impact, category.', color: 'from-blue-500 to-cyan-500' },
  { name: 'Task Planning Agent', icon: '📋', desc: 'Converts analysis into actionable tasks with dependencies.', color: 'from-indigo-500 to-brand-500' },
  { name: 'Coordination Agent', icon: '🔗', desc: 'Matches tasks to optimal specialized agents.', color: 'from-purple-500 to-pink-500' },
  { name: 'Execution Agent', icon: '⚡', desc: 'Executes permitted application-level workflow actions.', color: 'from-amber-500 to-orange-500' },
  { name: 'Monitoring Agent', icon: '👁', desc: 'Tracks progress, detects failures and delays in real-time.', color: 'from-emerald-500 to-teal-500' },
  { name: 'Replanning Agent', icon: '🔄', desc: 'Dynamically generates recovery plans when tasks fail.', color: 'from-red-500 to-orange-500' },
];

const features = [
  { icon: Brain, title: 'AI Problem Analysis', desc: 'Gemini AI analyzes your business problem, classifies it, and determines priority with confidence scores.' },
  { icon: GitBranch, title: 'Autonomous Task Planning', desc: 'AI generates multi-step task plans with dependencies and assigns them to specialized agents.' },
  { icon: AlertTriangle, title: 'Failure Detection & Replanning', desc: 'When tasks fail, the system automatically detects the issue and generates a dynamic recovery plan.' },
  { icon: Shield, title: 'Human-in-the-Loop', desc: 'High-impact decisions require human approval. Low-risk actions execute automatically.' },
  { icon: BarChart3, title: 'Workflow Health Score', desc: 'Dynamic 0-100 health score tracks workflow progress, failures, and recovery in real-time.' },
  { icon: RefreshCw, title: 'Chaos Mode', desc: 'Simulate realistic disruptions: agent failures, delays, rejections — test resilience of your workflows.' },
];

const steps = [
  { num: '01', title: 'Submit Problem', desc: 'Describe your business issue in plain language', icon: '💬' },
  { num: '02', title: 'AI Analyzes', desc: 'Analysis Agent classifies priority, impact, and departments', icon: '🔍' },
  { num: '03', title: 'Auto-Plan', desc: 'Planning Agent creates multi-step task workflow', icon: '📋' },
  { num: '04', title: 'Delegate', desc: 'Coordination Agent assigns tasks to specialized agents', icon: '🔗' },
  { num: '05', title: 'Execute', desc: 'Agents execute in parallel with monitoring', icon: '⚡' },
  { num: '06', title: 'Adapt', desc: 'System detects failures and replans autonomously', icon: '🔄' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-brand">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">WorkFlowX AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-8">
            <Bot size={14} />
            <span>Autonomous Multi-Agent Workflow Intelligence</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 leading-tight">
            <span className="text-gradient-white">Turn Business Problems</span>
            <br />
            <span className="text-gradient">Into Autonomous Workflows</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            WorkFlowX AI uses intelligent multi-agent systems to analyze problems, 
            plan workflows, coordinate tasks, monitor execution, and dynamically adapt when things change.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-4 glow-brand">
              <Zap size={18} />
              Launch Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4 border-brand-500/30 text-brand-300 hover:bg-brand-500/10">
              ⚡ Try Live Demo
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-4">
              See How It Works
              <ChevronDown size={16} />
            </a>
          </div>

          {/* Tagline */}
          <div className="mt-16 flex items-center justify-center gap-3 text-sm text-gray-600">
            {['Understand', 'Plan', 'Delegate', 'Execute', 'Adapt'].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                <span className="text-brand-400 font-semibold">{word}</span>
                {i < 4 && <span>→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-4">The Problem</div>
              <h2 className="text-4xl font-bold text-white mb-6">Organizations waste time on manual coordination</h2>
              <div className="space-y-3">
                {[
                  'Manually decomposing problems into tasks',
                  'Coordinating across disconnected departments',
                  'Tracking and following up on delayed work',
                  'Making inconsistent, slow decisions',
                  'No visibility into workflow progress',
                  'Repetitive administrative overhead',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8">
              <div className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-4">The Solution</div>
              <h3 className="text-2xl font-bold text-white mb-6">WorkFlowX AI handles it autonomously</h3>
              <div className="space-y-3">
                {[
                  'AI analyzes and decomposes problems automatically',
                  'Specialized agents coordinate seamlessly',
                  'Real-time monitoring and SLA tracking',
                  'Intelligent, consistent AI decisions',
                  'Full workflow visibility and health scores',
                  'Human approval only for high-impact actions',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle size={16} className="text-brand-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-4">How It Works</div>
            <h2 className="text-4xl font-bold text-white">The Agentic Workflow Loop</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.num} className="glass-card-hover p-6 relative">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-xs font-mono text-brand-400 mb-2">{step.num}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Architecture */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-4">Multi-Agent Architecture</div>
            <h2 className="text-4xl font-bold text-white">7 Specialized AI Agents</h2>
            <p className="text-gray-500 mt-4">Each agent has a distinct role, powered by Google Gemini AI</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <div key={agent.name} className="glass-card-hover p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg mb-4`}>
                  {agent.icon}
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{agent.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-4">Features</div>
            <h2 className="text-4xl font-bold text-white">Enterprise-Grade Agentic AI</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card-hover p-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-4">Technology Stack</div>
          <h2 className="text-3xl font-bold text-white mb-12">Built with Enterprise-Grade Tools</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'React + Vite', cat: 'Frontend' },
              { label: 'Tailwind CSS', cat: 'Styling' },
              { label: 'Node.js + Express', cat: 'Backend' },
              { label: 'JWT + bcrypt', cat: 'Auth' },
              { label: 'Supabase PostgreSQL', cat: 'Database' },
              { label: 'Google Gemini AI', cat: 'AI Engine' },
              { label: 'Netlify', cat: 'Frontend Deploy' },
              { label: 'Render', cat: 'Backend Deploy' },
            ].map(({ label, cat }) => (
              <div key={label} className="glass-card px-5 py-3 text-center">
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-gray-500">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            WorkFlowX AI doesn't just answer business problems.<br />
            It understands them, plans the work, coordinates agents, adapts to failures,<br />
            and drives the workflow toward resolution.
          </p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4 glow-brand inline-flex">
            <Zap size={20} />
            Start Free Now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={14} className="text-brand-400" />
          <span className="text-white font-semibold">WorkFlowX AI</span>
        </div>
        <p>Understand. Plan. Delegate. Execute. Adapt.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
