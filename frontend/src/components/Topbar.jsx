/**
 * EDU CARD AI — Topbar Component
 * Includes Event Demo Role Switcher, theme toggle, and current user actions.
 */

import React, { useState } from 'react';
import { Sun, Moon, LogOut, ChevronDown, UserCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ title = 'Dashboard' }) {
  const { user, logout, quickRoleSwitch } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const demoRoles = [
    { label: 'Admin', username: 'admin', pw: 'Admin@123' },
    { label: 'CS Faculty (Dr. Turing)', username: 'faculty_cs', pw: 'Faculty@123' },
    { label: 'DS Faculty (Dr. Lovelace)', username: 'faculty_ds', pw: 'Faculty@123' },
    { label: 'Mentor (Prof. Hopper)', username: 'mentor', pw: 'Mentor@123' },
    { label: 'Student (Aarav)', username: 'student', pw: 'Student@123' },
    { label: 'HoD (Dr. Johnson)', username: 'hod', pw: 'Hod@123' },
  ];

  const handleSwitch = async (roleObj) => {
    setDropdownOpen(false);
    await quickRoleSwitch(roleObj.username, roleObj.pw);
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 36px',
        position: 'sticky',
        top: 0,
        zIndex: 15,
      }}
    >
      {/* Title & Semester Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: 'var(--brand-primary)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sparkles size={12} /> Week 8 Active Monitoring
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Quick Role Switcher for Event Demos */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserCircle2 size={16} color="var(--brand-primary)" />
            <span>Role: {user?.role?.toUpperCase()}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '230px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '6px 10px',
                  textTransform: 'uppercase',
                }}
              >
                Instant Role Switch (Event Demo)
              </div>
              {demoRoles.map((r) => (
                <button
                  key={r.username}
                  onClick={() => handleSwitch(r)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      user?.username === r.username
                        ? 'rgba(79, 70, 229, 0.1)'
                        : 'transparent',
                    color:
                      user?.username === r.username
                        ? 'var(--brand-primary)'
                        : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{r.label}</span>
                  {user?.username === r.username && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark / Light theme"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
