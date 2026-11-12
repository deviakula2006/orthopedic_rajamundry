import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  KeyRound,
  ShieldCheck,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import apiClient from '../../services/api';

const ForgotPasswordModal = ({ isOpen, onClose, onPasswordResetSuccess }) => {
  // Wizard steps:
  // 1: Enter Registered Email
  // 2: Choose Recovery Method (Registered Email vs Hospital Fallback)
  // 3: Enter & Verify 6-digit OTP
  // 4: Set New Password
  // 5: Success Confirmation
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [recoverySessionId, setRecoverySessionId] = useState('');
  const [recoveryOptions, setRecoveryOptions] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('registered_email');
  const [activeMaskedDestination, setActiveMaskedDestination] = useState('');

  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [recoveredUsername, setRecoveredUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setEmail('');
    setRecoverySessionId('');
    setRecoveryOptions([]);
    setSelectedMethod('registered_email');
    setActiveMaskedDestination('');
    setOtp('');
    setResendCooldown(0);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setRecoveredUsername('');
    setError('');
    setInfoMsg('');
    setLoading(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // STEP 1: Submit registered email to identify account
  const handleInitiate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password/initiate', {
        email: email.trim().toLowerCase()
      });

      const data = res.data?.data || {};

      // STRICT CHECK: only advance if the email belongs to a known, active account
      if (!data.accountFound) {
        setError('This email is not registered with the organization.');
        return;
      }

      setRecoverySessionId(data.recoverySessionId || '');
      setRecoveryOptions(data.options || []);

      // Default to registered_email or hospital_email if available
      const registeredOpt = data.options?.find((o) => o.id === 'registered_email');
      const hospitalOpt = data.options?.find((o) => o.id === 'hospital_email');

      if (registeredOpt) {
        setSelectedMethod('registered_email');
      } else if (hospitalOpt && hospitalOpt.available) {
        setSelectedMethod('hospital_email');
      }

      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to initiate recovery. Please ensure the email address is valid.'
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Dispatch OTP to chosen recovery method
  const handleSendOtp = async (overrideMethod) => {
    const methodToUse = overrideMethod || selectedMethod;
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password/send-otp', {
        recoverySessionId,
        method: methodToUse
      });

      const data = res.data?.data || {};
      const chosenOption = recoveryOptions.find((o) => o.id === methodToUse);
      const masked = data.maskedRecipient || chosenOption?.maskedDestination || '';

      setActiveMaskedDestination(masked);
      setInfoMsg(
        data.message ||
          `A single-use verification code has been dispatched to ${masked}.`
      );
      setResendCooldown(60);
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to dispatch verification code. Please check your network or try another method.'
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Verify the 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password/verify-otp', {
        recoverySessionId,
        otp: otp.trim()
      });

      setResetToken(res.data?.data?.resetToken);
      setStep(4);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Invalid or expired verification code. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Set new password
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
      const res = await apiClient.post('/auth/forgot-password/reset-password', {
        recoverySessionId,
        resetToken,
        newPassword,
        confirmPassword
      });

      const uName = res.data?.data?.username || '';
      setRecoveredUsername(uName);
      setStep(5);

      if (onPasswordResetSuccess && uName) {
        onPasswordResetSuccess(uName);
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
        className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100"
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
                Admin, Doctor &amp; Receptionist Portal
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

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between px-8 pt-4 pb-2">
          {[
            { num: 1, label: 'Email' },
            { num: 2, label: 'Method' },
            { num: 3, label: 'Verify' },
            { num: 4, label: 'Reset' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  step > s.num
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : step === s.num
                    ? 'bg-hospital-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span
                className={`text-[11px] font-semibold hidden sm:inline ${
                  step === s.num
                    ? 'text-hospital-600 font-bold'
                    : step > s.num
                    ? 'text-slate-600'
                    : 'text-slate-400'
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
            {/* SCREEN 1: Enter Registered Email Address */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleInitiate}
                className="space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs leading-relaxed">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                    Secure Account Recovery
                  </p>
                  Enter the email address registered with your staff account (Admin,
                  Doctor, or Receptionist). We will prepare recovery options to verify
                  your identity.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Registered Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="e.g. staff.member@hospital.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                    />
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sign in uses your username. Password recovery uses your registered email.
                  </p>
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
                    disabled={loading || !email.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* SCREEN 2: Choose Recovery Method (Registered vs Hospital Fallback) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Choose Recovery Method
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select where you would like to receive your one-time verification code.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option A: Registered Email */}
                  {(() => {
                    const optA = recoveryOptions.find((o) => o.id === 'registered_email') || {
                      id: 'registered_email',
                      label: 'Send OTP to my registered email',
                      description:
                        'Receive a password reset OTP at the email address registered with your hospital account.',
                      maskedDestination: email ? `${email[0]}*****@${email.split('@')[1] || ''}` : '******'
                    };
                    const isSelected = selectedMethod === 'registered_email';

                    return (
                      <div
                        onClick={() => setSelectedMethod('registered_email')}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-hospital-500 bg-hospital-50/40 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg mt-0.5 shrink-0 ${
                            isSelected
                              ? 'bg-hospital-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {optA.label}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-hospital-500 bg-hospital-500'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {optA.description}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                            <span>Recipient:</span>
                            <span className="text-hospital-700 font-bold">
                              {optA.maskedDestination}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Option B: Hospital Email */}
                  {(() => {
                    const optB = recoveryOptions.find((o) => o.id === 'hospital_email') || {
                      id: 'hospital_email',
                      label: 'Try another way – Send OTP to Hospital Email',
                      description:
                        "If you cannot access your registered email, request the OTP through the hospital's official recovery inbox.",
                      maskedDestination: '******',
                      available: true
                    };
                    const isSelected = selectedMethod === 'hospital_email';
                    const isAvailable = optB.available !== false;

                    return (
                      <div
                        onClick={() => {
                          if (isAvailable) setSelectedMethod('hospital_email');
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                          !isAvailable
                            ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                            : isSelected
                            ? 'border-hospital-500 bg-hospital-50/40 shadow-sm cursor-pointer'
                            : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg mt-0.5 shrink-0 ${
                            isSelected && isAvailable
                              ? 'bg-hospital-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {optB.label}
                            </span>
                            {isAvailable ? (
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-hospital-500 bg-hospital-500'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {optB.description}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                            <span>Hospital Inbox:</span>
                            <span className="text-hospital-700 font-bold">
                              {optB.maskedDestination}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading || !selectedMethod}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-premium disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: Enter & Verify 6-digit OTP */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1 text-emerald-700 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Code Dispatched!
                  </p>
                  {infoMsg}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      6-Digit Verification Code <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Destination: <strong className="text-slate-600">{activeMaskedDestination}</strong>
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-center tracking-[0.3em] font-mono text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-slate-900 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
                    <span>Valid for 5 minutes.</span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400">
                        Resend in <strong className="text-slate-600 font-mono">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={loading}
                        className="font-bold text-hospital-600 hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtp('');
                      setStep(2);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Recovery Method</span>
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

            {/* SCREEN 4: Set New Password */}
            {step === 4 && (
              <motion.form
                key="step4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Create New Password
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your identity has been verified. Choose a strong new password for your account.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        newPassword.length >= 8
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        newPassword.length >= 8
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      At least 8 characters long
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        confirmPassword && newPassword === confirmPassword
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        confirmPassword && newPassword === confirmPassword
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      Passwords match
                    </span>
                  </div>
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
                      loading ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
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

            {/* SCREEN 5: Success Screen */}
            {step === 5 && (
              <motion.div
                key="step5"
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
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your password has been successfully reset.
                    {recoveredUsername && (
                      <>
                        {' '}You can now sign in with username{' '}
                        <strong className="text-slate-800 font-mono">{recoveredUsername}</strong>.
                      </>
                    )}
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
