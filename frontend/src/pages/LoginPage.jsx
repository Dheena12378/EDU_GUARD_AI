/**
 * EDU CARD AI — Comprehensive Sign In & Registration Portal
 * Provides:
 * 1. 1-Click Event Demo Personas (Judges & Presentation)
 * 2. Individual Sign In for Each and Every Student (ST101-ST128) & Faculty
 * 3. Individual Registration / New Account Sign-Up for Students & Faculty
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  User,
  KeyRound,
  UserPlus,
  LogIn,
  Search,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Active portal tab: 'demo' | 'individual' | 'register'
  const [activeTab, setActiveTab] = useState('individual');

  // Sign In form state
  const [username, setUsername] = useState('st101');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Directory lists for 1-click individual login
  const [studentsList, setStudentsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Registration form state
  const [regRole, setRegRole] = useState('student'); // 'student' | 'faculty'
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science');
  const [regStudentID, setRegStudentID] = useState('');
  const [regYear, setRegYear] = useState(1);
  const [regSemester, setRegSemester] = useState(1);
  const [regCourseID, setRegCourseID] = useState('CS-101');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Fetch all students and faculty for individual selection
  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const [stRes, facRes] = await Promise.all([
          api.get('/auth/all-students-list'),
          api.get('/auth/all-faculty-list'),
        ]);
        setStudentsList(stRes.data);
        setFacultyList(facRes.data);
      } catch (err) {
        console.error('Failed to load directories', err);
      }
    };
    fetchDirectories();
  }, []);

  const demoRoles = [
    {
      role: 'FACULTY (CS)',
      name: 'Dr. Alan Turing',
      username: 'faculty_cs',
      pw: 'Faculty@123',
      desc: 'Reviews CS student indicators & checks in early',
      icon: GraduationCap,
      color: '#4F46E5',
    },
    {
      role: 'MENTOR',
      name: 'Prof. Grace Hopper',
      username: 'mentor',
      pw: 'Mentor@123',
      desc: '1-on-1 supportive discussions & action logging',
      icon: UserCheck,
      color: '#06B6D4',
    },
    {
      role: 'STUDENT',
      name: 'Aarav Sharma (ST101)',
      username: 'st101',
      pw: 'Student@123',
      desc: 'Hero student: privacy-first engagement habits',
      icon: Layers,
      color: '#10B981',
    },
    {
      role: 'FACULTY (DS)',
      name: 'Dr. Ada Lovelace',
      username: 'faculty_ds',
      pw: 'Faculty@123',
      desc: 'Monitors Data Science cohort & sudden drops',
      icon: GraduationCap,
      color: '#8B5CF6',
    },
    {
      role: 'FACULTY (IT)',
      name: 'Prof. Tim Berners-Lee',
      username: 'faculty_it',
      pw: 'Faculty@123',
      desc: 'Manages Information Technology cohorts',
      icon: GraduationCap,
      color: '#06B6D4',
    },
    {
      role: 'ADMIN',
      name: 'System Administrator',
      username: 'admin',
      pw: 'Admin@123',
      desc: 'Audit trails, threshold configs, fairness audit',
      icon: ShieldCheck,
      color: '#F59E0B',
    },
  ];

  // Handle Standard / Individual Login
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Invalid username/student ID or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // Direct login helper from student/faculty directory list
  const handleDirectLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoginLoading(true);
    try {
      await login(u, p);
      navigate('/');
    } catch (err) {
      setLoginError('Failed to sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    try {
      const payload = {
        username: regUsername.trim(),
        password: regPassword,
        full_name: regFullName.trim(),
        email: regEmail.trim() || undefined,
        role: regRole,
        department: regDepartment,
      };

      if (regRole === 'student') {
        payload.student_id = regStudentID.trim() || undefined;
        payload.year = Number(regYear);
        payload.semester = Number(regSemester);
        payload.course_id = regCourseID.trim() || undefined;
      }

      await register(payload);
      navigate('/');
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setRegLoading(false);
    }
  };

  const filteredStudents = studentsList.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.department.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
      }}
    >
      <div style={{ maxWidth: '1080px', width: '100%' }}>
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              borderRadius: '24px',
              color: 'var(--brand-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={16} />
            <span>AI-Assisted Early Academic Support Prototype</span>
          </div>

          <h1
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
              background: 'var(--brand-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EDU CARD AI
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', fontSize: '0.94rem' }}>
            Detects early engagement shifts <strong>before</strong> exam scores drop.
            Individual authentication for every student and faculty member.
          </p>
        </div>

        {/* Top 3-Way Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '4px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('individual')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'individual' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'individual' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <LogIn size={15} />
              <span>Individual Sign In</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'register' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'register' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <UserPlus size={15} />
              <span>Register New Account</span>
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'demo' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'demo' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={15} />
              <span>1-Click Event Personas</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INDIVIDUAL SIGN IN (ANY STUDENT OR FACULTY) */}
        {activeTab === 'individual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Left: Interactive Directory of All 28 Students & Faculty */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Select Any Registered Student or Faculty
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Click any student below to immediately sign in as their individual profile
                  </p>
                </div>
              </div>

              {/* Student Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by student name, code (ST101-ST128), or department..."
                  className="input-field"
                  style={{ paddingLeft: '32px', fontSize: '0.8rem' }}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              {/* Scrollable Student List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                {filteredStudents.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No student matching search.
                  </div>
                ) : (
                  filteredStudents.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleDirectLogin(st.username, st.default_password)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    >
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          Code: <strong style={{ color: 'var(--brand-primary)' }}>{st.student_id}</strong> • {st.department} • Yr {st.year}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Sign In</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Faculty Quick Bar */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Faculty Accounts:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {facultyList.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleDirectLogin(f.username, f.default_password)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {f.name} ({f.department.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Direct Credentials Form */}
            <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                Sign In with Credentials
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Accepts either Username (e.g. <code>st101</code>, <code>faculty_cs</code>) or Student ID (e.g. <code>ST101</code>, <code>ST102</code>).
              </p>

              {loginError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '0.8rem',
                    marginBottom: '14px',
                  }}
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Username or Student ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                      placeholder="e.g. ST101 or st101 or faculty_cs"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '36px', paddingRight: '40px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Default password for all students: <strong>Student@123</strong> • Faculty: <strong>Faculty@123</strong>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loginLoading}
                  style={{ marginTop: '8px', padding: '12px', fontSize: '0.88rem' }}
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Don't have an individual account?{' '}
                <span
                  onClick={() => setActiveTab('register')}
                  style={{ color: 'var(--brand-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Register here
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW ACCOUNT */}
        {activeTab === 'register' && (
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '620px', margin: '0 auto 24px auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto',
                }}
              >
                <UserPlus size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Create New Individual Account</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Register as a Student to monitor personal engagement or as a Faculty to oversee departmental cohorts.
              </p>
            </div>

            {/* Role Switcher Pill */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', padding: '4px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRegRole('student')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: regRole === 'student' ? 'var(--brand-primary)' : 'transparent',
                    color: regRole === 'student' ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('faculty')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: regRole === 'faculty' ? 'var(--brand-primary)' : 'transparent',
                    color: regRole === 'faculty' ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Faculty Account
                </button>
              </div>
            </div>

            {regError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#EF4444',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={regRole === 'student' ? 'e.g. Devika Nair' : 'e.g. Dr. Claude Shannon'}
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>

              {/* Student specific fields */}
              {regRole === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Student Roll / ID
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. ST129"
                      value={regStudentID}
                      onChange={(e) => setRegStudentID(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                      Academic Year & Semester
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        className="input-field"
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                      >
                        <option value={1}>Year 1</option>
                        <option value={2}>Year 2</option>
                        <option value={3}>Year 3</option>
                        <option value={4}>Year 4</option>
                      </select>
                      <select
                        className="input-field"
                        value={regSemester}
                        onChange={(e) => setRegSemester(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  className="input-field"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Desired Username
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. devika or prof_claude"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@university.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Create secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="btn btn-primary"
                style={{ marginTop: '8px', padding: '12px' }}
              >
                {regLoading ? 'Registering Account...' : 'Complete Registration & Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <span
                onClick={() => setActiveTab('individual')}
                style={{ color: 'var(--brand-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign in here
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: 1-CLICK DEMO PERSONAS FOR EVENT JUDGES */}
        {activeTab === 'demo' && (
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '14px',
              }}
            >
              {demoRoles.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.username}
                    onClick={() => handleDirectLogin(r.username, r.pw)}
                    className="glass-panel"
                    style={{
                      padding: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      borderLeft: `4px solid ${r.color}`,
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: `${r.color}15`,
                        color: r.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {r.desc}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '10px',
                            backgroundColor: `${r.color}20`,
                            color: r.color,
                          }}
                        >
                          {r.role}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {r.username}
                        </span>
                      </div>
                    </div>

                    <ArrowRight size={18} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Status & Compliance Banner */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span>
              All <strong>28 Students</strong> (ST101–ST128) & Faculty Accounts Active • Self-Service Registration Online
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="var(--brand-primary)" />
            <span>DPDP 2023 & FERPA Aligned • Demographic Isolation Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
