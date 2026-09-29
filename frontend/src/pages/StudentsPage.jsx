/**
 * EDU CARD AI — Students Directory Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, UserCheck, Shield } from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';
import DisclaimerBanner from '../components/DisclaimerBanner';
import IndicatorBadge from '../components/IndicatorBadge';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [bandFilter, setBandFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter !== 'All') params.department = deptFilter;
      if (bandFilter !== 'All') params.indicator_band = bandFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/students', { params });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [deptFilter, bandFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="main-content">
      <Topbar title="Student Academic Monitoring Directory" />

      <div className="page-container">
        <DisclaimerBanner />

        {/* Filter and Search Bar */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '9px 16px' }}>
              Search
            </button>
          </form>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Department:
            </span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          {/* Indicator Band Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Indicator:
            </span>
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              <option value="All">All Bands</option>
              <option value="Low">Low Support Need</option>
              <option value="Medium">Medium Support Need</option>
              <option value="High">High Support Need</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
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
                <th style={{ padding: '14px 20px' }}>Student</th>
                <th style={{ padding: '14px 16px' }}>Department</th>
                <th style={{ padding: '14px 16px' }}>Term</th>
                <th style={{ padding: '14px 16px' }}>Early Support Indicator</th>
                <th style={{ padding: '14px 16px' }}>Attendance</th>
                <th style={{ padding: '14px 16px' }}>Assignments</th>
                <th style={{ padding: '14px 16px' }}>Active Alerts</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.student_id}
                      </div>
                    </td>

                    <td style={{ padding: '16px 16px', fontSize: '0.85rem' }}>
                      {s.department}
                    </td>

                    <td style={{ padding: '16px 16px', fontSize: '0.85rem' }}>
                      Yr {s.year} • Sem {s.semester}
                    </td>

                    <td style={{ padding: '16px 16px' }}>
                      <IndicatorBadge band={s.latest_indicator_band} />
                    </td>

                    <td style={{ padding: '16px 16px', fontSize: '0.88rem', fontWeight: 600 }}>
                      {s.attendance_latest ? `${s.attendance_latest}%` : '—'}
                    </td>

                    <td style={{ padding: '16px 16px', fontSize: '0.88rem', fontWeight: 600 }}>
                      {s.assignment_latest ? `${s.assignment_latest}%` : '—'}
                    </td>

                    <td style={{ padding: '16px 16px' }}>
                      {s.active_alert_count > 0 ? (
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#D97706',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {s.active_alert_count} Active
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      >
                        <span>Review Profile</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
