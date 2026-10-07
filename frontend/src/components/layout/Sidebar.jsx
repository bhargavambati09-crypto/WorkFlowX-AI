import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, GitBranch, CheckSquare, Bell, BarChart3,
  Bot, Settings, LogOut, Plus, ChevronLeft, ChevronRight,
  Zap, Shield, Activity, Users, Menu, X, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/approvals', label: 'Approvals', icon: Shield },
  { path: '/agents', label: 'Agent Command', icon: Bot },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/judge-mode', label: 'Judge Mode', icon: Sparkles, highlight: true },
  { path: '/profile', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="glass-card h-full flex flex-col rounded-none border-r border-l-0 border-t-0 border-b-0 border-white/5">
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 glow-brand">
              <Zap size={18} className="text-white" />
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-white text-sm">WorkFlowX AI</div>
                <div className="text-[10px] text-gray-500">Multi-Agent Intelligence</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action */}
        {!collapsed && (
          <div className="p-3">
            <Link to="/workflows/new"
              className="btn-primary w-full justify-center text-sm py-2.5">
              <Plus size={15} />
              New Workflow
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link key={path} to={path}
                className={`${active ? 'nav-item-active' : 'nav-item'} ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? label : ''}>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && path === '/approvals' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                {!collapsed && path === '/judge-mode' && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">DEMO</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Collapse */}
        <div className="border-t border-white/5 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                <div className="mt-1 flex items-center">
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/20 uppercase tracking-wide">
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className={`nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? 'Logout' : ''}>
            <LogOut size={16} />
            {!collapsed && 'Logout'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="nav-item w-full justify-end text-gray-600 hover:text-gray-400">
            {collapsed ? <ChevronRight size={16} /> : <><span className="flex-1 text-xs">Collapse</span><ChevronLeft size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TopBar = ({ title, subtitle, actions }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
