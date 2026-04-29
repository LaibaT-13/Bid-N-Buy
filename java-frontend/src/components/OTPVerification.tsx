import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { authService } from '../services/api';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
  isRegistrationFlow?: boolean;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerificationSuccess, onBack, isRegistrationFlow = false }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
    setOtp(newOtp);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      if (isRegistrationFlow) {
        await authService.verifyOTP(email, otpValue);
        setSuccess('Email verified! Redirecting...');
        setTimeout(onVerificationSuccess, 1500);
      } else {
        onVerificationSuccess();
      }
    } catch (err) {
      setError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(''); setSuccess('');
    try {
      await authService.resendOTP(email);
      setSuccess('A new code has been sent to your email.');
      setCountdown(60); setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      const timer = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
    } catch { setError('Failed to resend code. Please try again.'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Verify Your Email</h1>
            <p className="text-blue-100 text-sm mt-1">Enter the 6-digit code sent to</p>
            <p className="text-white font-bold text-sm mt-0.5">{email}</p>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <CheckCircle className="h-4 w-4 flex-shrink-0" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Boxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">Enter Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => inputRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 transition-all focus:outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${digit ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'}`}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || otp.join('').length !== 6}
                className="w-full btn-primary py-3 font-bold disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...
                  </span>
                ) : 'Verify Email'}
              </button>

              {/* Resend */}
              <div className="text-center">
                {canResend ? (
                  <button type="button" onClick={handleResend} disabled={resending}
                    className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Resend code in <span className="font-bold text-gray-600 dark:text-gray-300">{countdown}s</span></p>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={onBack} className="text-sm text-blue-300 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
            <ArrowLeft className="h-4 w-4" /> Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
