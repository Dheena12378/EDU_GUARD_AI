/**
 * EDU GUARD AI — Analytics & Fairness Audit Page
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [importance, setImportance] = useState([]);
  const [fairness, setFairness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, featRes, fairRes] = await Promise.all([
          api.get('/analytics/trends'),
          api.get('/analytics/feature-importance'),
          api.get('/analytics/fairness-audit'),
        ]);
        setTrends(trendRes.data);
        setImportance(featRes.data);
        setFairness(fairRes.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <Topbar title="Trends & Algorithmic Fairness" />
        <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
          Loading cohort analytics and fairness audits...
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Topbar title="Cohort Trends & Algorithmic Fairness" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* 16-Week Cohort Engagement Trends */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                16-Week Cohort Engagement Trajectory
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Aggregated weekly averages across all monitored students in the institution
              </p>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
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
                <Line
                  type="monotone"
                  dataKey="avg_attendance"
                  name="Attendance %"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="avg_assignment"
                  name="Assignment Completion %"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="avg_score"
                  name="Assessment Score %"
                  stroke="#10B981"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="avg_logins"
                  name="LMS Logins"
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Feature Importance & SHAP Attributions */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Global Feature Importance (SHAP Explainability)
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Demonstrating that behavioral trend deltas dominate over absolute snapshot metrics
              </p>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={importance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis dataKey="display_name" type="category" stroke="var(--text-muted)" style={{ fontSize: '0.78rem' }} />
                <Tooltip
                  formatter={(val) => [`${(val * 100).toFixed(1)}% impact`, 'Attribution']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '10px',
                  }}
                />
                <Bar dataKey="importance" fill="var(--brand-primary)" radius={[0, 6, 6, 0]}>
                  {importance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#4F46E5' : index === 1 ? '#06B6D4' : '#8B5CF6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic Fairness & Disparate Impact Audit */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <Scale size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Demographic Fairness Audit (Equal Parity Verification)
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Rigorous Disparate Impact evaluation across protected and demographic groups
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              <ShieldCheck size={16} />
              <span>{fairness?.overall_fairness || 'PASSED'}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            {fairness?.compliance_notes}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Category Groups */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px' }}>
                Social Category Parity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fairness?.categories?.map((cat) => (
                  <div key={cat.group_name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>{cat.group_name} (n={cat.sample_size})</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>
                      Ratio: {cat.disparate_impact_ratio} ({cat.status})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Groups */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px' }}>
                Gender Parity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fairness?.genders?.map((g) => (
                  <div key={g.group_name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>{g.group_name} (n={g.sample_size})</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>
                      Ratio: {g.disparate_impact_ratio} ({g.status})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Socioeconomic Bands */}
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px' }}>
                Socioeconomic Parity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fairness?.socioeconomic_bands?.map((tier) => (
                  <div key={tier.group_name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>{tier.group_name} (n={tier.sample_size})</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>
                      Ratio: {tier.disparate_impact_ratio} ({tier.status})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
