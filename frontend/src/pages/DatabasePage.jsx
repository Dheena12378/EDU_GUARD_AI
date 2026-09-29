/**
 * EDU CARD AI — Interactive SQLite Database Explorer & Connection Hub
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  Play,
  Terminal,
  HardDrive,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Lock,
} from 'lucide-react';

import api from '../services/api';
import Topbar from '../components/Topbar';

const PRESET_QUERIES = [
  {
    name: 'Top 10 Predictions',
    sql: 'SELECT student_id, week_number, probability, indicator_band FROM predictions ORDER BY week_number DESC, probability DESC LIMIT 10;',
  },
  {
    name: 'Active Alerts',
    sql: 'SELECT id, student_id, week_number, severity, alert_text, status FROM alerts ORDER BY week_number DESC;',
  },
  {
    name: 'Support Interventions',
    sql: 'SELECT id, student_id, action_type, action_title, status, created_at FROM interventions;',
  },
  {
    name: 'Registered Users',
    sql: 'SELECT id, username, role, full_name, department FROM users ORDER BY id ASC LIMIT 20;',
  },
  {
    name: 'Aarav (ST101) Timeline',
    sql: "SELECT week_number, attendance_pct, assignment_completion_pct, assessment_score, lms_logins FROM weekly_records WHERE student_id = 'ST101' ORDER BY week_number ASC;",
  },
  {
    name: 'Engineered Features Sample',
    sql: 'SELECT student_id, week_number, attendance_2w_avg, assignment_2w_avg, submission_gap_avg, lms_login_drop_pct FROM features LIMIT 10;',
  },
];

export default function DatabasePage() {
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedTable, setSelectedTable] = useState('students');
  const [tableData, setTableData] = useState(null);
  const [loadingTable, setLoadingTable] = useState(false);

  // SQL Runner state
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT student_id, name, department, year, semester, academic_standing FROM students LIMIT 10;'
  );
  const [queryResult, setQueryResult] = useState(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryError, setQueryError] = useState(null);

  const [copied, setCopied] = useState(false);

  // Fetch status on mount
  useEffect(() => {
    fetchDbStatus();
  }, []);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (selectedTable) {
      fetchTable(selectedTable);
    }
  }, [selectedTable]);

  const fetchDbStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.get('/admin/sqlite-status');
      setDbStatus(res.data);
    } catch (err) {
      console.error('Failed to get SQLite status', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchTable = async (tName) => {
    setLoadingTable(true);
    try {
      const res = await api.get(`/admin/sqlite-table/${tName}?limit=25`);
      setTableData(res.data);
    } catch (err) {
      console.error(`Failed to load table ${tName}`, err);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleRunQuery = async (queryToRun) => {
    const query = queryToRun || sqlQuery;
    if (!query.trim()) return;

    setRunningQuery(true);
    setQueryError(null);
    try {
      const res = await api.post('/admin/sqlite-query', { query });
      setQueryResult(res.data);
    } catch (err) {
      setQueryResult(null);
      setQueryError(err.response?.data?.detail || err.message || 'Failed to execute query.');
    } finally {
      setRunningQuery(false);
    }
  };

  const copyPath = () => {
    if (dbStatus?.database_file) {
      navigator.clipboard.writeText(dbStatus.database_file);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="main-content">
      <Topbar title="SQLite Database Hub & Live Inspector" />

      <div className="page-container">
        {/* Connection Overview Header */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(79, 70, 229, 0.15)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {dbStatus?.database_type || (dbStatus?.dialect === 'postgresql' ? 'PostgreSQL Cloud Database' : 'Database Connected')}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'inline-block',
                    }}
                  />
                  {dbStatus?.dialect === 'postgresql' ? 'POSTGRESQL CLOUD' : 'WAL MODE'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>{dbStatus?.dialect === 'postgresql' ? 'Cloud URL:' : 'File:'}</span>
                <code
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                    maxWidth: '460px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dbStatus?.dialect === 'postgresql'
                    ? (dbStatus?.database_url_masked || 'postgresql://***@cloud-host:5432/dbname')
                    : (dbStatus?.database_file || 'c:\\EDU_CARD_AI\\edu_card_ai.db')}
                </code>
                <button
                  onClick={copyPath}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {dbStatus?.dialect === 'postgresql' ? 'Dialect' : 'Database Size'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {dbStatus?.dialect === 'postgresql' ? 'PostgreSQL' : (dbStatus?.size_kb ? `${dbStatus.size_kb} KB` : '1,072 KB')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Tables</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {dbStatus?.tables?.length || 9} Tables
              </div>
            </div>
            <button
              onClick={() => {
                fetchDbStatus();
                if (selectedTable) fetchTable(selectedTable);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              title="Refresh Database Status"
            >
              <RefreshCw size={15} className={loadingStatus ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* 3 Quick Ways to Connect with Database Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Terminal size={17} color="var(--brand-primary)" />
              <strong style={{ fontSize: '0.86rem' }}>1. Python Connection CLI</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Inspect live tables and test queries on PostgreSQL or SQLite:
            </p>
            <code
              style={{
                display: 'block',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                color: '#10B981',
                fontFamily: 'monospace',
              }}
            >
              python db_connect.py
            </code>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <HardDrive size={17} color="#06B6D4" />
              <strong style={{ fontSize: '0.86rem' }}>2. Cloud PostgreSQL & Migration</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Migrate existing records or seed fresh directly into PostgreSQL:
            </p>
            <code
              style={{
                display: 'block',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                color: '#06B6D4',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              python migrate_sqlite_to_postgres.py
            </code>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Play size={17} color="#8B5CF6" />
              <strong style={{ fontSize: '0.86rem' }}>3. Live Query Console</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Execute read-only SQL queries directly from your browser:
            </p>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Supports PostgreSQL and SQLite with millisecond latency metrics.
            </div>
          </div>
        </div>

        {/* Tables Navigation Strip */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            SELECT A TABLE TO EXPLORE:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {dbStatus?.tables?.map((t) => {
              const isSelected = selectedTable === t.table;
              return (
                <button
                  key={t.table}
                  onClick={() => setSelectedTable(t.table)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                  }}
                >
                  <Table size={14} />
                  <span>{t.table}</span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-elevated)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {t.rows}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Data Preview */}
        {selectedTable && (
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Table size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Table: <span style={{ color: 'var(--brand-primary)' }}>{selectedTable}</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ({tableData?.total_rows || 0} total rows)
                </span>
                {selectedTable === 'sensitive_data' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    <Lock size={12} /> Demographics Quarantined
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Showing first 25 records
              </div>
            </div>

            {loadingTable ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                Loading table data...
              </div>
            ) : tableData && tableData.rows ? (
              <div style={{ overflowX: 'auto', maxHeight: '360px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '2px solid var(--border-subtle)' }}>
                      {tableData.columns.map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: '8px 12px',
                              whiteSpace: 'nowrap',
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: typeof cell === 'number' ? 'monospace' : 'inherit',
                            }}
                          >
                            {cell === null ? (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                            ) : typeof cell === 'boolean' ? (
                              cell ? 'TRUE' : 'FALSE'
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No records found.
              </div>
            )}
          </div>
        )}

        {/* Live SQL Query Runner Console */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Interactive SQLite Query Console
              </h3>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Read-Only Safe Mode (SELECT / PRAGMA)
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Quick Preset Queries:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_QUERIES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSqlQuery(preset.sql);
                    handleRunQuery(preset.sql);
                  }}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Area */}
          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              placeholder="Enter SQLite query (e.g. SELECT * FROM students LIMIT 10;)"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.84rem',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Press 'Run Query' to evaluate against SQLite WAL engine.
            </div>
            <button
              onClick={() => handleRunQuery()}
              disabled={runningQuery || !sqlQuery.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={14} className={runningQuery ? 'spin' : ''} />
              <span>{runningQuery ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>

          {/* Error Message */}
          {queryError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.82rem',
                marginBottom: '16px',
              }}
            >
              {queryError}
            </div>
          )}

          {/* Query Results */}
          {queryResult && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: '6px 6px 0 0',
                  border: '1px solid var(--border-subtle)',
                  borderBottom: 'none',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600 }}>
                  <CheckCircle2 size={14} />
                  <span>Success: {queryResult.row_count} rows returned</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Latency: <strong>{queryResult.execution_time_ms} ms</strong>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0 0 6px 6px',
                  overflowX: 'auto',
                  maxHeight: '320px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                      {queryResult.columns.map((c) => (
                        <th
                          key={c}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'var(--brand-primary)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((r, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        }}
                      >
                        {r.map((val, vIdx) => (
                          <td
                            key={vIdx}
                            style={{
                              padding: '8px 12px',
                              whiteSpace: 'nowrap',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: typeof val === 'number' ? 'monospace' : 'inherit',
                            }}
                          >
                            {val === null ? (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                            ) : typeof val === 'boolean' ? (
                              val ? 'TRUE' : 'FALSE'
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
