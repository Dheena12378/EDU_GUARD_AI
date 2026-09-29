/**
 * EDU CARD AI — Core Concept Pipeline Strip
 * DETECT -> EXPLAIN -> ALERT -> SUPPORT -> HUMAN REVIEW
 */

import React from 'react';
import { Eye, HelpCircle, Bell, HeartHandshake, UserCheck } from 'lucide-react';

export default function PipelineStrip({ currentStep = 'SUPPORT' }) {
  const steps = [
    { key: 'DETECT', label: 'Detect', desc: 'Baseline & Trend Analysis', icon: Eye },
    { key: 'EXPLAIN', label: 'Explain', desc: 'SHAP Attributions', icon: HelpCircle },
    { key: 'ALERT', label: 'Alert', desc: 'Faculty Notification', icon: Bell },
    { key: 'SUPPORT', label: 'Support', desc: 'Playbook Actions', icon: HeartHandshake },
    { key: 'HUMAN REVIEW', label: 'Human Review', desc: 'Mentor Decides & Logs', icon: UserCheck },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        margin: '16px 0 24px 0',
        overflowX: 'auto',
        gap: '12px',
      }}
    >
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.key === currentStep;
        const isPast = idx < currentIdx;

        return (
          <React.Fragment key={step.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: isActive ? 1 : isPast ? 0.9 : 0.45,
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive
                    ? 'var(--brand-primary)'
                    : isPast
                    ? 'rgba(79, 70, 229, 0.15)'
                    : 'var(--border-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  boxShadow: isActive ? '0 0 12px rgba(79, 70, 229, 0.4)' : 'none',
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-main)',
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {step.desc}
                </div>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isPast ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  minWidth: '24px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
