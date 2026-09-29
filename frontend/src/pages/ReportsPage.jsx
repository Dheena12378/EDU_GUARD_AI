/**
 * EDU CARD AI — Reports & Academic Review Page
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/reports/summary');
        setReport(res.data);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-content">
      <Topbar title="Academic Monitoring Reports" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handlePrint} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>

        {/* Report Document Sheet */}
        <div className="glass-panel" style={{ padding: '36px', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--brand-primary)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Institutional Academic Audit
                </span>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
                  {report?.report_title || 'Semester Early Support & Engagement Review'}
                </h1>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Term: {report?.academic_term} • Generated on: {report?.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'Today'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={16} />
                <span>Verified Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
              Key Institutional Observations
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {report?.key_takeaways?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    color: 'var(--text-main)',
                  }}
                >
                  <CheckCircle size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
              Departmental Summary
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Enrolled Students</th>
                  <th style={{ padding: '12px 16px' }}>Active Indicators</th>
                  <th style={{ padding: '12px 16px' }}>Actioned Check-ins</th>
                  <th style={{ padding: '12px 16px' }}>Completed Interventions</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Faculty Response Rate</th>
                </tr>
              </thead>
              <tbody>
                {report?.departments?.map((d) => (
                  <tr key={d.department} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{d.department}</td>
                    <td style={{ padding: '14px 16px' }}>{d.total_students}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: d.active_alerts > 0 ? '#F59E0B' : '#10B981' }}>
                        {d.active_alerts}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{d.resolved_alerts}</td>
                    <td style={{ padding: '14px 16px' }}>{d.completed_checkins}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                      {d.response_rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
