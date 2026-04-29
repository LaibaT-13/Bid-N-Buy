import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('A 6-digit reset code has been sent to your email.');
      setStep('otp');
    } catch {
      setError('No account found with this email address.');
    } finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await authService.resetPassword(email, otp, newPassword);
      setStep('success');
    } catch {
      setError('Invalid or expired code. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">
              {step === 'success' ? 'Password Reset!' : 'Forgot Password'}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {step === 'email' ? 'Enter your CUET email to receive a reset code' : step === 'otp' ? 'Enter the code sent to your email' : 'Your password has been updated'}
            </p>
          </div>

          <div className="px-8 py-6">
            {step === 'success' ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-6">Your password has been reset successfully. You can now sign in.</p>
                <button onClick={() => navigate('/login')} className="w-full btn-primary py-3">Go to Sign In</button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mb-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" /> {message}
                  </div>
                )}

                {step === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">CUET Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                          className="input-field pl-10" placeholder="u22XXXXX@student.cuet.ac.bd" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full btn-primary py-3 font-bold">
                      {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : 'Send Reset Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">6-Digit Code</label>
                      <input type="text" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="input-field text-center text-2xl font-bold tracking-[0.5em] py-3" placeholder="000000" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          className="input-field pl-10 pr-10" placeholder="Min. 6 characters" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          className="input-field pl-10" placeholder="Re-enter password" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full btn-primary py-3 font-bold">
                      {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</span> : 'Reset Password'}
                    </button>
                    <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      ← Back to email
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-blue-300 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
