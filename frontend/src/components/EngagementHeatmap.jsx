/**
 * EDU CARD AI — 16-Week Engagement Activity Heatmap
 * Visualizes multi-dimensional engagement matrix over 16 academic weeks.
 * Instantly reveals the "Early Fade" pattern before assessment scores drop.
 */

import React, { useState } from 'react';
import { Calendar, Eye, Info } from 'lucide-react';

export default function EngagementHeatmap({ records = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!records || records.length === 0) {
    return null;
  }

  // Define rows to display
  const rows = [
    { key: 'attendance_pct', label: 'Attendance', unit: '%', max: 100 },
    { key: 'assignment_completion_pct', label: 'Assignments', unit: '%', max: 100 },
    { key: 'lms_logins', label: 'LMS Logins', unit: '', max: 25 },
    { key: 'active_days', label: 'Active Days', unit: ' d', max: 7 },
    { key: 'class_participation_score', label: 'Participation', unit: '/10', max: 10 },
    { key: 'assessment_score', label: 'Exam Scores', unit: '%', max: 100 },
  ];

  // Helper to calculate cell color based on normalized score (0 to 100)
  const getCellColor = (val, max) => {
    if (val === null || val === undefined) return 'var(--bg-surface-elevated)';
    const pct = Math.min(100, Math.max(0, (val / max) * 100));

    // High engagement: Emerald
    if (pct >= 85) return 'rgba(16, 185, 129, 0.85)';
    if (pct >= 75) return 'rgba(16, 185, 129, 0.55)';
    // Softening: Amber
    if (pct >= 60) return 'rgba(245, 158, 11, 0.75)';
    if (pct >= 45) return 'rgba(245, 158, 11, 0.45)';
    // Low: Royal Purple (non-punitive alert color)
    return 'rgba(139, 92, 246, 0.75)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              16-Week Engagement Intensity Heatmap
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Color intensity indicates weekly activity. Notice how LMS and assignment rows soften in Weeks 5–8 while Exam Scores remain high!
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(16, 185, 129, 0.85)' }} />
            Robust (&ge;80%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(245, 158, 11, 0.75)' }} />
            Moderate (50-79%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(139, 92, 246, 0.75)' }} />
            Softened (&lt;50%)
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: '3px', width: '100%', minWidth: '720px' }}>
          <thead>
            <tr>
              <th style={{ width: '140px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 8px' }}>
                Metric Dimension
              </th>
              {records.map((r) => {
                const isCurrent = r.week_number === 8;
                const isBaseline = r.week_number <= 3;
                return (
                  <th
                    key={r.week_number}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      padding: '6px 2px',
                      backgroundColor: isCurrent
                        ? 'rgba(79, 70, 229, 0.12)'
                        : isBaseline
                        ? 'rgba(6, 182, 212, 0.06)'
                        : 'transparent',
                      borderRadius: '4px',
                    }}
                  >
                    W{r.week_number}
                    {isCurrent && <div style={{ fontSize: '0.62rem', color: 'var(--brand-primary)' }}>Now</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    padding: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.label}
                </td>
                {records.map((r) => {
                  const val = r[row.key];
                  const bg = getCellColor(val, row.max);
                  const isCurrent = r.week_number === 8;

                  return (
                    <td
                      key={r.week_number}
                      onMouseEnter={() =>
                        setHoveredCell({
                          week: r.week_number,
                          metric: row.label,
                          value: val !== null ? `${val}${row.unit}` : 'N/A',
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        backgroundColor: bg,
                        color: '#FFFFFF',
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '10px 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                        border: isCurrent ? '2px solid var(--brand-primary)' : '1px solid transparent',
                        boxShadow: isCurrent ? '0 0 6px rgba(79, 70, 229, 0.4)' : 'none',
                      }}
                    >
                      {val !== null && val !== undefined ? Math.round(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Info bar */}
      <div
        style={{
          marginTop: '12px',
          minHeight: '26px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Info size={14} color="var(--brand-primary)" />
        {hoveredCell ? (
          <span>
            Week <strong>{hoveredCell.week}</strong> • <strong>{hoveredCell.metric}</strong>:{' '}
            <strong style={{ color: 'var(--brand-primary)' }}>{hoveredCell.value}</strong>
          </span>
        ) : (
          <span>Hover over any heatmap block to view exact weekly metrics and baseline comparisons.</span>
        )}
      </div>
    </div>
  );
}
