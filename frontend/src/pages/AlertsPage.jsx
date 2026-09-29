/**
 * EDU CARD AI — Early Support Alerts Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, ArrowRight, XCircle, Clock, ShieldAlert } from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';
import IndicatorBadge from '../components/IndicatorBadge';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [targetAlertId, setTargetAlertId] = useState(null);
  const [dismissReason, setDismissReason] = useState('Student discussed circumstances directly with faculty');
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'All') params.state = activeTab.toLowerCase();
      const res = await api.get('/alerts', { params });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/status`, { state: 'acknowledged' });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const handleDismissSubmit = async (e) => {
    e.preventDefault();
    if (!targetAlertId) return;
    try {
      await api.post(`/alerts/${targetAlertId}/dismiss`, { reason: dismissReason });
      setDismissModalOpen(false);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to dismiss alert', err);
    }
  };

  const tabs = ['All', 'New', 'Acknowledged', 'Action_Taken', 'Dismissed'];

  return (
    <div className="main-content">
      <Topbar title="Early Support Alerts" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No alerts found for this filter tab.
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="glass-panel"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                      {a.student_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ({a.student_code})
                    </span>
                    <IndicatorBadge band={a.severity} size="sm" />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      State: {a.state.replace('_', ' ')}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '8px' }}>
                    {a.alert_text}
                  </p>

                  {/* Signals */}
                  {a.signals && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {a.signals.map((sig, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                            color: 'var(--brand-primary)',
                            fontWeight: 600,
                          }}
                        >
                          {sig.label || sig.factor}: {sig.status} ({sig.delta > 0 ? `+${sig.delta}` : sig.delta}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {a.feedback && (
                    <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '6px', fontStyle: 'italic' }}>
                      Feedback: {a.feedback}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {a.state === 'new' && (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                    >
                      <CheckCircle size={14} />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/students/${a.student_id}`)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                  >
                    <span>Support Actions</span>
                    <ArrowRight size={14} />
                  </button>

                  {a.state !== 'dismissed' && (
                    <button
                      onClick={() => {
                        setTargetAlertId(a.id);
                        setDismissModalOpen(true);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '7px 10px', color: 'var(--text-muted)' }}
                      title="Dismiss alert"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Dismiss Alert */}
        {dismissModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <div
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Dismiss Early Support Alert
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Faculty review: Provide a brief reason for dismissing this indicator.
              </p>

              <form onSubmit={handleDismissSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea
                  rows={3}
                  className="input-field"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDismissModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Confirm Dismissal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
