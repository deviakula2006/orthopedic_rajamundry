import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw
} from 'lucide-react';
import apiClient from '../../services/api';

const ForgotPasswordModal = ({ isOpen, onClose, onPasswordResetSuccess }) => {
  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Reset, 4: Success
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setUsername('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfoMsg('');
    setLoading(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password/request', {
        username: username.trim()
      });
      setInfoMsg(
        res.data?.data?.message ||
          'A single-use verification code has been dispatched to the hospital recovery email.'
      );
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to request recovery code. Please check your network or contact administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password/verify', {
        username: username.trim(),
        otp: otp.trim()
      });
      setResetToken(res.data?.data?.resetToken);
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Invalid or expired verification code. Please check with administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password/reset', {
        username: username.trim(),
        resetToken,
        newPassword,
        confirmPassword
      });
      setStep(4);
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(username);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to reset password. The recovery session may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-hospital-500/10 text-hospital-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Staff Password Recovery
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                Admin, Doctor & Receptionist Portal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between px-8 pt-4 pb-2">
          {[
            { num: 1, label: 'Identifier' },
            { num: 2, label: 'Verify OTP' },
            { num: 3, label: 'New Password' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  step >= s.num
                    ? 'bg-hospital-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span
                className={`text-[11px] font-semibold hidden sm:inline ${
                  step === s.num ? 'text-hospital-600 font-bold' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Enter Username */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRequestOtp}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs leading-relaxed">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-blue-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hospital Recovery Protocol:
                  </p>
                  For security, the one-time passcode will be routed exclusively
                  to the official <strong>Hospital Recovery Email</strong>. An
                  administrator or inbox custodian must communicate the code to you.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Account Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. admin, dr.arjun, or staff email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !username.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: Enter OTP */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1 text-emerald-700 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    OTP Dispatched!
                  </p>
                  {infoMsg}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Enter OTP from hospital email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-center tracking-[0.25em] font-mono text-lg font-bold rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-slate-900 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Valid for 5 minutes. Contact your admin if you have not received it.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-hospital-600 hover:underline cursor-pointer"
                  >
                    ← Change Username
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !otp.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !newPassword || newPassword !== confirmPassword
                    }
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: Success Message */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Password Reset Complete
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Your password has been securely updated. You can now log into
                    the hospital portal with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium cursor-pointer"
                >
                  Return to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordModal;
