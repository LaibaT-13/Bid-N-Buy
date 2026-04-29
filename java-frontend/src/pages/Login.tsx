import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Shield, Phone, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OTPVerification from '../components/OTPVerification';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '', phone: '', address: ''
  });
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  const isValidCuetEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return false;
    const emailLower = email.toLowerCase().trim();
    return emailLower.endsWith('@cuet.ac.bd') || emailLower.endsWith('@student.cuet.ac.bd');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        if (!isValidCuetEmail(formData.email)) {
          setError('Only CUET email addresses (@cuet.ac.bd or @student.cuet.ac.bd) are allowed.');
          return;
        }
        if (isAdminLogin) {
          await adminLogin(formData.email, formData.password);
          navigate('/admin/items');
        } else {
          await login(formData.email, formData.password);
          navigate('/');
        }
      } else {
        if (!isValidCuetEmail(formData.email)) {
          setError('Only CUET email addresses (@cuet.ac.bd or @student.cuet.ac.bd) are allowed.');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }
        const response = await fetch('http://localhost:8080/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uName: formData.name, uPhone: formData.phone,
            uCusMail: formData.email, uPassword: formData.password, address: formData.address
          }),
        });
        if (response.ok) {
          setPendingEmail(formData.email);
          setShowOTPVerification(true);
          setError('');
        } else {
          const errorText = await response.text();
          setError(errorText || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTPVerification(false);
    setIsLogin(true);
    setFormData({ email: '', password: '', confirmPassword: '', name: '', phone: '', address: '' });
  };

  if (showOTPVerification && pendingEmail) {
    return <OTPVerification
      email={pendingEmail}
      onVerificationSuccess={handleOTPVerificationSuccess}
      onBack={() => { setShowOTPVerification(false); setPendingEmail(''); }}
      isRegistrationFlow={true}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
              <span className="text-white font-black text-xl">BB</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isLogin ? (isAdminLogin ? 'Admin Portal' : 'Welcome Back') : 'Create Account'}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {isLogin
                ? (isAdminLogin ? 'Access the admin dashboard' : 'Sign in to your Bid & Buy account')
                : 'Join the CUET campus marketplace'}
            </p>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Login type toggle */}
            {isLogin && (
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
                <button type="button" onClick={() => setIsAdminLogin(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${!isAdminLogin ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  <User className="h-4 w-4" />
                  User Login
                </button>
                <button type="button" onClick={() => setIsAdminLogin(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${isAdminLogin ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  <Shield className="h-4 w-4" />
                  Admin Login
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input name="name" type="text" required value={formData.name} onChange={handleInputChange}
                        className="input-field pl-10" placeholder="Enter your full name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input name="phone" type="tel" required value={formData.phone} onChange={handleInputChange}
                        className="input-field pl-10" placeholder="01XXXXXXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input name="address" type="text" value={formData.address} onChange={handleInputChange}
                        className="input-field pl-10" placeholder="Hall / Room / Area" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">CUET Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input name="email" type="email" required value={formData.email} onChange={handleInputChange}
                    className="input-field pl-10" placeholder="u22XXXXX@student.cuet.ac.bd" />
                </div>
                <p className="mt-1 text-xs text-gray-400">Only @cuet.ac.bd or @student.cuet.ac.bd emails</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleInputChange}
                    className="input-field pl-10 pr-10" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleInputChange}
                      className="input-field pl-10 pr-10" placeholder="Confirm your password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                  isAdminLogin
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200 dark:shadow-red-900/30'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-200 dark:shadow-blue-900/30'
                }`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  isLogin ? (isAdminLogin ? 'Sign In as Admin' : 'Sign In') : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle signup/login */}
            {!isAdminLogin && (
              <div className="text-center pt-1">
                <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-sm text-gray-500 dark:text-gray-400">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features card */}
        {isLogin && !isAdminLogin && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 text-white">
            <div className="flex items-center justify-around text-center">
              {[
                { icon: '🔒', text: 'CUET Only' },
                { icon: '♻️', text: 'Reuse & Save' },
                { icon: '⚡', text: 'Live Auctions' },
              ].map((f) => (
                <div key={f.text} className="flex flex-col items-center gap-1">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-xs text-blue-100 font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
