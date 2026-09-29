/**
 * EDU GUARD AI — Sidebar Navigation Component
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  HeartHandshake,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
  ShieldCheck,
  Database,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/alerts', label: 'Early Alerts', icon: Bell, hideFor: ['student'] },
    { to: '/interventions', label: 'Support Actions', icon: HeartHandshake },
    { to: '/analytics', label: 'Trends & Fairness', icon: BarChart3, hideFor: ['student'] },
    { to: '/reports', label: 'Audit Reports', icon: FileText, hideFor: ['student'] },
    { to: '/database', label: 'Database Hub', icon: Database },
    { to: '/settings', label: 'Settings & Policy', icon: Settings },
  ];

  const role = user?.role || 'student';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div
          style={{
            padding: '22px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  background: 'var(--brand-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EDU GUARD AI
              </div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                Supportive Academic Monitoring
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={closeSidebar}
            className="mobile-close-btn"
            aria-label="Close Navigation"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems
            .filter((item) => !item.hideFor || !item.hideFor.includes(role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeSidebar}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

      {/* Ethics & Compliance Pill */}
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={16} color="var(--brand-primary)" />
          <span>DPDP 2023 & FERPA Aligned</span>
        </div>
      </div>

      {/* Current User Profile Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          {user?.full_name ? user.full_name[0] : 'U'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.full_name || 'User'}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--brand-primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {user?.role || 'Guest'}
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
