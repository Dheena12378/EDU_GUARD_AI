/**
 * EDU CARD AI — Support Interventions & Check-ins Page
 */

import React, { useState, useEffect } from 'react';
import { HeartHandshake, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [targetInvId, setTargetInvId] = useState(null);
  const [outcomeText, setOutcomeText] = useState('Student attended office hours; renewed engagement confirmed.');
  const navigate = useNavigate();

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interventions');
      setInterventions(res.data);
    } catch (err) {
      console.error('Failed to load interventions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const handleCompleteIntervention = async (e) => {
    e.preventDefault();
    if (!targetInvId) return;
    try {
      await api.patch(`/interventions/${targetInvId}`, {
        status: 'completed',
        outcome: outcomeText,
      });
      setOutcomeModalOpen(false);
      fetchInterventions();
    } catch (err) {
      console.error('Failed to update intervention', err);
    }
  };

  const filtered = interventions.filter((inv) => {
    if (statusFilter === 'All') return true;
    return inv.status === statusFilter.toLowerCase();
  });

  return (
    <div className="main-content">
      <Topbar title="Supportive Actions & Check-in Log" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Planned', 'In_Progress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: statusFilter === tab ? 'var(--brand-primary)' : 'transparent',
                  color: statusFilter === tab ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 12px' }}
          >
            <span>Initiate Check-in from Student Directory</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Interventions Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading support actions...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No support actions logged in this category.
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
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
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                      {inv.action_title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor:
                          inv.status === 'completed'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: inv.status === 'completed' ? '#10B981' : '#F59E0B',
                        textTransform: 'uppercase',
                      }}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '6px' }}>
                    Student: {inv.student_name} • Facilitator: {inv.created_by_name || 'Faculty Mentor'}
                  </div>

                  {inv.action_details && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {inv.action_details}
                    </p>
                  )}

                  {inv.notes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Notes: {inv.notes}
                    </div>
                  )}

                  {inv.outcome && (
                    <div style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 600, marginTop: '6px' }}>
                      Recorded Outcome: {inv.outcome}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {inv.status !== 'completed' && (
                    <button
                      onClick={() => {
                        setTargetInvId(inv.id);
                        setOutcomeModalOpen(true);
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Log Resolution</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/students/${inv.student_id}`)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                  >
                    <span>View Student</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Log Resolution Outcome */}
        {outcomeModalOpen && (
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
                maxWidth: '480px',
                padding: '24px',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Record Support Outcome
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Summarize the result of this check-in for the academic record.
              </p>

              <form onSubmit={handleCompleteIntervention} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea
                  rows={3}
                  className="input-field"
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setOutcomeModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Mark Completed
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
