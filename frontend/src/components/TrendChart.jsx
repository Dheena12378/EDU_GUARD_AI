/**
 * EDU CARD AI — Advanced Multi-Metric Timeline Chart
 * Visualizes 16 weeks of engagement with personal baseline zone and detection marker
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Eye, TrendingUp, Filter } from 'lucide-react';

export default function TrendChart({ records = [] }) {
  const [visibleMetrics, setVisibleMetrics] = useState({
    attendance: true,
    assignment: true,
    assessment: true,
    lmsTime: true,
    classMedian: true,
  });

  const toggleMetric = (key) => {
    setVisibleMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Augment records with mock class median for comparison
  const chartData = records.map((r) => ({
    ...r,
    classMedianAttendance: 87.5,
    classMedianAssignment: 85.0,
    timeScaled: r.time_spent_minutes ? Math.round(r.time_spent_minutes / 3) : 0, // Scaled for 0-100 chart axis
  }));

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '20px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              16-Week Engagement Trajectory & Early Signal Point
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Notice: Weeks 1–3 define the personal baseline. Early engagement shifts at Week 8 trigger alerts before exam scores drop.
          </p>
        </div>

        {/* Interactive Metric Toggle Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => toggleMetric('attendance')}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #4F46E5',
              backgroundColor: visibleMetrics.attendance ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
              color: visibleMetrics.attendance ? '#4F46E5' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Attendance
          </button>

          <button
            onClick={() => toggleMetric('assignment')}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #06B6D4',
              backgroundColor: visibleMetrics.assignment ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: visibleMetrics.assignment ? '#06B6D4' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Assignments
          </button>

          <button
            onClick={() => toggleMetric('assessment')}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #10B981',
              backgroundColor: visibleMetrics.assessment ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: visibleMetrics.assessment ? '#10B981' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Exams
          </button>

          <button
            onClick={() => toggleMetric('lmsTime')}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #F59E0B',
              backgroundColor: visibleMetrics.lmsTime ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: visibleMetrics.lmsTime ? '#F59E0B' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            LMS Time
          </button>

          <button
            onClick={() => toggleMetric('classMedian')}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #94A3B8',
              backgroundColor: visibleMetrics.classMedian ? 'rgba(148, 163, 184, 0.15)' : 'transparent',
              color: visibleMetrics.classMedian ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Class Median
          </button>
        </div>
      </div>

      <div style={{ height: '340px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="week_number" tickFormatter={(w) => `Wk ${w}`} stroke="var(--text-muted)" />
            <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                borderRadius: '10px',
              }}
            />
            <Legend />

            {/* Shaded Personal Baseline Area (Weeks 1 to 3) */}
            <ReferenceArea
              x1={1}
              x2={3}
              fill="rgba(79, 70, 229, 0.06)"
              stroke="rgba(79, 70, 229, 0.2)"
              strokeDasharray="3 3"
              label={{
                value: 'Personal Baseline Zone',
                position: 'insideTopLeft',
                fill: 'var(--brand-primary)',
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            {/* Vertical Marker at Week 8 (Current Early Alert Trigger) */}
            <ReferenceLine
              x={8}
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: 'Detection Week 8',
                position: 'top',
                fill: '#8B5CF6',
                fontSize: 12,
                fontWeight: 800,
              }}
            />

            {visibleMetrics.attendance && (
              <Line
                type="monotone"
                dataKey="attendance_pct"
                name="Attendance %"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            )}

            {visibleMetrics.assignment && (
              <Line
                type="monotone"
                dataKey="assignment_completion_pct"
                name="Assignment %"
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            )}

            {visibleMetrics.assessment && (
              <Line
                type="monotone"
                dataKey="assessment_score"
                name="Assessment %"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            )}

            {visibleMetrics.lmsTime && (
              <Line
                type="monotone"
                dataKey="timeScaled"
                name="LMS Time (Scaled)"
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )}

            {visibleMetrics.classMedian && (
              <Line
                type="monotone"
                dataKey="classMedianAttendance"
                name="Cohort Median (Ref)"
                stroke="#94A3B8"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
