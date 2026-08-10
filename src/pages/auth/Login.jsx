import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import loginBg from '../../assets/login_bg.png';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) { setError(result.message); return; }
      const role = result.user.role;
      if      (role === 'Admin')        navigate('/admin/dashboard');
      else if (role === 'Receptionist') navigate('/receptionist/dashboard');
      else if (role === 'Doctor')       navigate('/doctor/dashboard');
      else                              setError(`Unsupported role: ${role}`);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Input field style helper ── */
  const inputBase = {
    width: '100%', height: 42, paddingLeft: 40, paddingRight: 14,
    borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb',
    fontSize: '0.875rem', fontWeight: 500, color: '#0f172a',
    outline: 'none', transition: 'all 140ms', fontFamily: 'inherit',
  };
  const handleFocus = e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3898f3'; e.target.style.boxShadow = '0 0 0 3px rgba(56,152,243,0.12)'; };
  const handleBlur  = e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }}>

      {/* ─── Left — Form Panel ───────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '2.5rem 3rem',
        background: '#ffffff', boxShadow: '1px 0 0 0 #e8eaed, 4px 0 24px rgba(0,0,0,0.06)',
        position: 'relative', zIndex: 10,
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #2278e8, #26a1ae)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(34,120,232,0.35)',
          }}>
            <HeartPulse style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1 }}>
              RAJAHMUNDRY ORTHOPEDIC
            </div>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#2278e8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Hospital Management System
            </div>
          </div>
        </div>

        {/* Form area */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Heading */}
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.025em', marginBottom: 6 }}>
              Sign in
            </h1>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '1.75rem' }}>
              Enter your credentials to access the dashboard.
            </p>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8, marginBottom: '1.25rem',
                  background: '#fff1f2', border: '1px solid #fecdd3',
                  fontSize: '0.8125rem', fontWeight: 600, color: '#be123c',
                }}
              >
                <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    style={inputBase}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...inputBase, paddingRight: 40 }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                  >
                    {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#111827' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#2278e8' }}
                  />
                  Remember me
                </label>
                <a href="#forgot" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2278e8', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 42, borderRadius: 8, border: 'none',
                  background: isSubmitting ? '#93c5fd' : '#2278e8',
                  color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'background 150ms',
                  boxShadow: '0 1px 2px rgba(34,120,232,0.3)',
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#1c6dd9'; }}
                onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = '#2278e8'; }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight style={{ width: 15, height: 15 }} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6b7280', textAlign: 'center' }}>
          © {new Date().getFullYear()} Rajahmundry Orthopedic Hospital. All rights reserved.
        </p>
      </div>

      {/* ─── Right — Hero Image ──────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0f172a',  }} className="lg:block" >
        <img
          src={loginBg}
          alt="Orthopedic Hospital"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(10,15,30,0.85) 0%, rgba(10,15,30,0.4) 50%, transparent 100%)' }} />

        {/* Text content */}
        <div style={{ position: 'absolute', bottom: '4rem', left: '3.5rem', right: '3.5rem' }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 99, marginBottom: 16,
            background: 'rgba(34,120,232,0.2)', border: '1px solid rgba(34,120,232,0.3)',
            backdropFilter: 'blur(8px)', fontSize: '0.6875rem', fontWeight: 700,
            color: '#93c5fd', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Advanced Bone & Joint Care
          </span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.025em', marginBottom: 12 }}>
            Empowering Orthopedic Care with Modern Operations.
          </h2>
          <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#cbd5e1', lineHeight: 1.7 }}>
            Manage surgeries, patient diagnostics, ward assignments, and billing using a unified, responsive dashboard.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
