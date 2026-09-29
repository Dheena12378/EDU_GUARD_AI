/**
 * EDU CARD AI — Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Bell,
  HeartHandshake,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';
import IndicatorBadge from '../components/IndicatorBadge';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <Topbar title="Overview Dashboard" />
        <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
          Loading monitoring metrics...
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const distribution = data?.distribution || [];
  const urgentAlerts = data?.urgent_alerts || [];
  const recentIntvs = data?.recent_interventions || [];

  return (
    <div className="main-content">
      <Topbar title="Academic Monitoring Overview" />

      <div className="page-container">
        {/* Mandatory Ethical AI Disclaimer */}
        <DisclaimerBanner />

        {/* Top KPI Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            marginBottom: '28px',
          }}
        >
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total Students Monitored
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, margin: '10px 0 4px 0' }}>
              {stats.total_students || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Across 3 Engineering Departments
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Early Support Alerts
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <Bell size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, margin: '10px 0 4px 0', color: '#F59E0B' }}>
              {stats.active_alerts_count || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Suggested for proactive review
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Completed Check-ins
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <HeartHandshake size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, margin: '10px 0 4px 0', color: '#10B981' }}>
              {stats.completed_interventions_count || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              100% voluntary supportive actions
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Cohort Avg Attendance
              </span>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, margin: '10px 0 4px 0' }}>
              {stats.average_attendance || 86.4}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Assignment Avg: {stats.average_assignment_completion || 84.1}%
            </div>
          </div>
        </div>

        {/* Charts and Feeds Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', marginBottom: '28px' }}>
          {/* Indicator Band Distribution */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
              Early Support Indicator Distribution
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Colour-blind safe grouping: Low (Emerald), Medium (Amber), High (Royal Purple)
            </p>

            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="band"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '10px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              {distribution.map((d) => (
                <div key={d.band} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: d.color }}>
                    {d.count} ({d.percentage}%)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {d.band} Support
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Early Support Alerts Feed */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Active Early Support Alerts
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Triggered based on sustained metric drops or sudden changes
                </p>
              </div>
              <button onClick={() => navigate('/alerts')} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                View All Alerts
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urgentAlerts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No active alerts for current department scope.
                </div>
              ) : (
                urgentAlerts.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {a.student_name} ({a.student_code})
                        </span>
                        <IndicatorBadge band={a.severity} size="sm" />
                        {a.is_sudden_change && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#EF4444',
                              fontWeight: 700,
                            }}
                          >
                            Sudden Change
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {a.alert_text}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/students/${a.student_id}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px', whiteSpace: 'nowrap' }}
                    >
                      <span>Review Profile</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
