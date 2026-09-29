/**
 * EDU GUARD AI — SHAP Feature Contribution Diverging Chart
 * Visualizes which factors pull toward higher support need vs which factors protect/stabilize.
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { HelpCircle } from 'lucide-react';

export default function ShapContributionChart({ shapValues = {} }) {
  if (!shapValues || Object.keys(shapValues).length === 0) {
    return null;
  }

  const nameMap = {
    activity_delta_baseline: 'LMS Logins Drop vs Baseline',
    assignment_4w_slope: '4-Week Assignment Trajectory',
    consecutive_decline_count: 'Consecutive Decline Streak',
    attendance_delta_baseline: 'Attendance Drop vs Baseline',
    missed_submission_streak: 'Missed Assignment Deadlines',
    attendance_volatility: 'Attendance Fluctuations',
    activity_2w_avg: 'Recent 2-Week LMS Logins',
    participation_4w_slope: 'Participation Trajectory',
    days_since_last_activity: 'Days Inactive on LMS',
    assignment_2w_avg: 'Recent Assignment Completion',
    attendance_2w_avg: 'Recent Attendance Rate',
  };

  // Convert dict to array, sort by absolute impact
  const data = Object.entries(shapValues)
    .filter(([k, v]) => Math.abs(v) > 0.005)
    .map(([k, v]) => ({
      featureKey: k,
      name: nameMap[k] || k.replace(/_/g, ' '),
      impact: Math.round(v * 100) / 100,
      direction: v > 0 ? 'Support Recommended' : 'Protective / Stabilizing',
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 7);

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              SHAP Attributions: What Drove This Indicator?
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Purple bars pull towards proactive check-in; green bars are stabilizing factors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8B5CF6', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#8B5CF6' }} />
            Pulls Toward Support (+SHAP)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10B981' }} />
            Stabilizing (-SHAP)
          </span>
        </div>
      </div>

      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`} />
            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" style={{ fontSize: '0.76rem' }} />
            <Tooltip
              formatter={(val, name, item) => [`${val > 0 ? '+' : ''}${val} impact`, item.payload.direction]}
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                borderRadius: '10px',
              }}
            />
            <ReferenceLine x={0} stroke="var(--border-highlight)" strokeWidth={1.5} />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact > 0 ? '#8B5CF6' : '#10B981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
