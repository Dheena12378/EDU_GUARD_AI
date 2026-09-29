/**
 * EDU GUARD AI — Student Profile & Early Support Hero Showcase
 * Implements: DETECT -> EXPLAIN -> ALERT -> SUPPORT -> HUMAN REVIEW
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  HelpCircle,
  TrendingDown,
  Calendar,
  CheckCircle,
  PlusCircle,
  HeartHandshake,
  AlertTriangle,
  Lightbulb,
  Activity,
  Layers,
} from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';
import IndicatorBadge from '../components/IndicatorBadge';
import PipelineStrip from '../components/PipelineStrip';
import IndicatorGauge from '../components/IndicatorGauge';
import TrendChart from '../components/TrendChart';
import EngagementHeatmap from '../components/EngagementHeatmap';
import ShapContributionChart from '../components/ShapContributionChart';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intervention creation modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Counterfactual simulation state
  const [simulatedChanges, setSimulatedChanges] = useState({
    extraLogins: false,
    submitPending: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, histRes, trendsRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/students/${id}/history`),
        api.get(`/students/${id}/trends`),
      ]);
      setStudent(stRes.data);
      setHistory(histRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error('Failed to load student details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLaunchSupportAction = (suggestion) => {
    setSelectedAction(suggestion);
    setActionNotes(`Follow-up check-in based on early engagement shift.`);
    setModalOpen(true);
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    setSubmittingAction(true);
    try {
      await api.post('/interventions', {
        student_id: student.id,
        action_type: selectedAction.type || 'mentor_discussion',
        action_title: selectedAction.title,
        action_details: selectedAction.description,
        notes: actionNotes,
      });
      setActionSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        setActionSuccess(false);
        fetchData();
      }, 1200);
    } catch (err) {
      console.error('Failed to create intervention', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <Topbar title="Student Profile" />
        <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
          Loading student engagement profile...
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="main-content">
        <Topbar title="Student Not Found" />
        <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
          Student profile could not be located.
        </div>
      </div>
    );
  }

  const pred = student.latest_prediction || {};
  const explanationSentences = pred.explanation_sentences || [];
  const playbookSuggestions = pred.playbook_suggestions || [];
  const shapValues = pred.shap_values || {};

  // Simulated probability calculation
  let simulatedProb = pred.probability || 0.15;
  if (simulatedChanges.extraLogins) simulatedProb = Math.max(0.12, simulatedProb - 0.28);
  if (simulatedChanges.submitPending) simulatedProb = Math.max(0.10, simulatedProb - 0.32);
  const simulatedBand = simulatedProb < 0.3 ? 'Low' : simulatedProb < 0.6 ? 'Medium' : 'High';

  return (
    <div className="main-content">
      <Topbar title={`${student.name} — Academic Monitoring`} />

      <div className="page-container">
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Directory</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Code:</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.85rem' }}>
              {student.student_id}
            </span>
          </div>
        </div>

        {/* Core Concept Pipeline Strip */}
        <PipelineStrip currentStep="SUPPORT" />

        {/* Hero Top Grid: Profile Overview & Circular Indicator Gauge */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* Left: Student Metadata & Context */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{student.name}</h1>
                <IndicatorBadge band={pred.indicator_band} size="lg" />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <span>Department: <strong>{student.department}</strong></span>
                <span>•</span>
                <span>Year {student.year} • Semester {student.semester}</span>
                <span>•</span>
                <span>Course: <strong>{student.course_id || 'CS-301'}</strong></span>
              </div>

              {/* Status summary banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '2px', color: 'var(--text-main)' }}>
                  Monitoring Summary (Week 8):
                </div>
                <span>
                  Exam score remains solid at <strong>82%</strong>, but digital engagement metrics (LMS logins and submission rhythm)
                  have trended downward compared to Aarav's established Weeks 1–3 personal baseline.
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Model: {pred.model_name || 'RandomForest Calibrated'} • Zero Demographic Inputs
            </div>
          </div>

          {/* Right: Circular Gauge */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndicatorGauge probability={pred.probability} band={pred.indicator_band} size={230} />
          </div>
        </div>

        {/* Mandatory Ethical AI Disclaimer */}
        <DisclaimerBanner text={pred.disclaimer} />

        {/* 16-Week Multi-Metric Timeline Chart */}
        <TrendChart records={history} />

        {/* 16-Week Engagement Activity Heatmap */}
        <EngagementHeatmap records={history} />

        {/* Explainability & Counterfactual Simulator Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}
        >
          {/* EXPLAIN Section: Plain Language Reasoning */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)' }}>
                <HelpCircle size={18} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Why did this indicator appear?
              </h2>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Synthesized from SHAP local feature attributions and personal baseline deltas:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {explanationSentences.map((sent, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.84rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.45',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(79, 70, 229, 0.15)',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{sent}</span>
                </div>
              ))}
            </div>

            {/* Counterfactual Interactive Simulator */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(79, 70, 229, 0.05)',
                border: '1px dashed rgba(79, 70, 229, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Lightbulb size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Simulator: What would adjust this indicator?
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={simulatedChanges.extraLogins}
                    onChange={(e) =>
                      setSimulatedChanges({ ...simulatedChanges, extraLogins: e.target.checked })
                    }
                  />
                  <span>Student logs into LMS portal 3+ days this upcoming week</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={simulatedChanges.submitPending}
                    onChange={(e) =>
                      setSimulatedChanges({ ...simulatedChanges, submitPending: e.target.checked })
                    }
                  />
                  <span>Student submits the pending laboratory assignment</span>
                </label>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(79, 70, 229, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Projected Indicator:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IndicatorBadge band={simulatedBand} size="sm" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--brand-primary)' }}>
                    {(simulatedProb * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: SHAP Contribution Chart */}
          <ShapContributionChart shapValues={shapValues} />
        </div>

        {/* SUPPORT Section: Optional Playbook Suggestions */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <HeartHandshake size={18} />
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Support Playbook Actions (Human-in-the-Loop)
            </h2>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            These supportive options are tailored to identified engagement factors. All actions require mentor review:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {playbookSuggestions.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        color: 'var(--brand-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {item.factor_origin}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    onClick={() => handleLaunchSupportAction(item)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '7px 14px', width: '100%' }}
                  >
                    <PlusCircle size={14} />
                    <span>Initiate Check-in</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Check-in History */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
            Recorded Check-in History & Outcomes
          </h2>

          {student.interventions && student.interventions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {student.interventions.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{inv.action_title}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: inv.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: inv.status === 'completed' ? '#10B981' : '#F59E0B',
                        textTransform: 'uppercase',
                      }}
                    >
                      {inv.status}
                    </span>
                  </div>
                  {inv.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Notes: {inv.notes}
                    </div>
                  )}
                  {inv.outcome && (
                    <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                      Outcome: {inv.outcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No check-ins have been recorded yet for this student.
            </div>
          )}
        </div>

        {/* Modal: Initiate Support Check-in */}
        {modalOpen && (
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
                maxWidth: '520px',
                padding: '28px',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
                Initiate Supportive Check-in
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Student: <strong>{student.name}</strong> ({student.student_id})
              </p>

              {actionSuccess ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#10B981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={36} />
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    Support Action Recorded Successfully!
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateIntervention} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Selected Support Action
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={selectedAction?.title || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Support Strategy Details
                    </label>
                    <textarea
                      rows={2}
                      className="input-field"
                      value={selectedAction?.description || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Faculty / Mentor Notes
                    </label>
                    <textarea
                      rows={3}
                      className="input-field"
                      placeholder="Add supportive check-in context, scheduled meeting time, or peer study notes..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="btn btn-primary"
                    >
                      {submittingAction ? 'Recording...' : 'Confirm Support Action'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
