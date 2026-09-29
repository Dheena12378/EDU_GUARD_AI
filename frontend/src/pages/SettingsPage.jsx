/**
 * EDU CARD AI — Settings, Ethical AI Policy & Compliance
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Ban,
  Sliders,
  RefreshCw,
  Lock,
  CheckCircle,
} from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        setSettingsData(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/admin/retrain');
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 3000);
    } catch (err) {
      console.error('Retraining failed', err);
    } finally {
      setRetraining(false);
    }
  };

  const thresholds = settingsData?.thresholds || {};
  const bannedWords = settingsData?.banned_words || [];

  return (
    <div className="main-content">
      <Topbar title="Settings, Ethics & Data Privacy" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* Ethical AI Governance & Policy Header */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            borderLeft: '4px solid var(--brand-primary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={20} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Ethical AI Charter & Algorithmic Guardrails
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '720px' }}>
              EDU CARD AI operates under strict non-punitive mandates: it never predicts student failure,
              does not compute rank scores, and isolates all sensitive demographic attributes from the feature pipeline.
            </p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '9px 16px', whiteSpace: 'nowrap' }}
            >
              <RefreshCw size={15} className={retraining ? 'spin' : ''} />
              <span>{retraining ? 'Calibrating...' : retrainSuccess ? 'Calibrated!' : 'Trigger Re-calibration'}</span>
            </button>
          )}
        </div>

        {/* Grid: Banned Words & Active Thresholds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {/* Banned Words Monitor */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Ban size={18} color="#EF4444" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                Banned Vocabulary Guardrail
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              These terms are strictly prohibited from all UI texts, explanations, and model outputs.
              Enforced by automated backend sanitizers and unit tests:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {bannedWords.map((word) => (
                <span
                  key={word}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                  }}
                >
                  "{word}"
                </span>
              ))}
            </div>
          </div>

          {/* Active Configured Thresholds */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sliders size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                Active Algorithmic Parameters
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Loaded dynamically from thresholds.yaml:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Personal Baseline Period</span>
                <strong>{thresholds?.zscore?.personal_baseline_weeks || 3} Weeks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trend Classification Range</span>
                <strong>[-5.0%, +5.0%] pp</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sudden Drop Threshold</span>
                <strong style={{ color: '#EF4444' }}>&le; -15.0% single week</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Alert Fatigue Cooldown</span>
                <strong>{thresholds?.alerts?.cooldown_weeks || 3} Weeks</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>HoD Min Cohort Privacy Size</span>
                <strong>&ge; {thresholds?.privacy?.min_cohort_size_for_aggregates || 5} Students</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance Badges */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '14px' }}>
            Privacy Architecture & Regulatory Alignment
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--brand-primary)', marginBottom: '4px' }}>
                DPDP Act 2023 (India)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Purpose limitation, student rights of access, and non-disclosure of behavioral records to unauthorized parties.
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#06B6D4', marginBottom: '4px' }}>
                FERPA Aligned
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Strict role-based segregation: faculty cannot view students outside their assigned sections; mentors see only mentees.
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#10B981', marginBottom: '4px' }}>
                Demographic Isolation
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Sensitive categories and gender are quarantined into a separate table, solely for post-hoc algorithmic parity checks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
