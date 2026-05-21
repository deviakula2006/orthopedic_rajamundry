import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import loginBg from '../../assets/login_bg.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('Super Admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(username, password, role);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-slate-50">
      {/* Left Column - Branding & Form */}
      <div className="flex w-full flex-col justify-between px-6 py-8 md:px-12 lg:w-[45%] xl:w-[40%] bg-white relative z-10 shadow-2xl">
        {/* Logo Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-hospital-500 to-cyanic-400 text-white shadow-premium">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-800 leading-none">
              RAJAHMUNDRY ORTHOPEDIC
            </h1>
            <span className="text-[11px] font-bold text-hospital-600 tracking-wider uppercase">
              Hospital Management System
            </span>
          </div>
        </div>

        {/* Center Card */}
        <div className="my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                Sign in to your account
              </h2>
              <p className="mt-1.5 text-sm font-medium text-slate-400">
                Select your administrative role and enter credentials
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs font-semibold text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Doctor (Future Module)">Doctor (Future Module)</option>
                  <option value="Receptionist (Future Module)">Receptionist (Future Module)</option>
                </select>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g., admin)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g., admin123)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-hospital-500 focus:ring-hospital-500 h-4 w-4"
                  />
                  Remember me
                </label>
                <a href="#forgot" className="text-hospital-600 hover:text-hospital-700">
                  Forgot Password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 py-3.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none focus:ring-2 focus:ring-hospital-500/50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Helper Credentials Box */}
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-[11px] font-semibold text-slate-500 leading-relaxed">
              <span className="text-slate-700 font-bold uppercase block mb-1">Demo Credentials:</span>
              <p>Username: <code className="bg-white px-1 py-0.5 rounded border text-hospital-600 font-mono">admin</code></p>
              <p>Password: <code className="bg-white px-1 py-0.5 rounded border text-hospital-600 font-mono">admin123</code></p>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs font-medium text-slate-400">
          &copy; {new Date().getFullYear()} Rajahmundry Orthopedic Hospital. All rights reserved.
        </div>
      </div>

      {/* Right Column - Premium AI Generated Hospital Artwork */}
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-slate-900">
        <img
          src={loginBg}
          alt="Orthopedic Hospital"
          className="absolute inset-0 h-full w-full object-cover opacity-80 scale-105"
        />
        {/* Soft overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent"></div>

        {/* Quote overlay */}
        <div className="absolute bottom-16 left-16 right-16 text-white max-w-lg">
          <span className="inline-block rounded-full bg-hospital-500/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-hospital-300 border border-hospital-500/30 mb-4">
            Advanced Bone & Joint Care
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug">
            Empowering Orthopedic Care with Modern Operations.
          </h2>
          <p className="mt-4 text-sm font-medium text-slate-300 leading-relaxed">
            Manage bone trauma surgeries, patient diagnostics, ward assignments, and instant bill calculations using a unified, responsive dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
