import React, { useState } from 'react';
import {
  Server,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { verifySupabaseCredentials } from '../lib/supabase';
import { recordSystemAccessLog } from '../utils/systemLogger';

interface LoginModalProps {
  onLoginSuccess: () => void;
  appName?: string;
  appLogo?: string;
  tagline?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  appName = 'BBL DM System',
  appLogo = '',
  tagline = 'Enterprise Device Management',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await verifySupabaseCredentials(email, password);
    setIsLoading(false);

    if (res.success) {
      // Record access log with IP, Location & Laptop profile
      recordSystemAccessLog(email, 'User Login').catch((e) => console.warn(e));
      onLoginSuccess();
    } else {
      setErrorMsg(res.message || 'Invalid credentials. Please verify and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Subtle Indigo & Slate Gradient Mesh */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-950/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Main Single Centered Login Card */}
      <div className="relative w-full max-w-md my-auto rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 bg-slate-900/95 backdrop-blur-xl z-10 transition-all">
        
        {/* Top Header with App Branding */}
        <div className="bg-gradient-to-b from-indigo-900/50 via-slate-900/80 to-transparent p-6 sm:p-8 pb-4 text-center border-b border-indigo-500/10">
          <div className="inline-flex items-center justify-center mb-3.5">
            {appLogo ? (
              <img
                src={appLogo}
                alt={appName}
                className="w-14 h-14 rounded-2xl object-contain bg-white/10 p-1.5 border border-white/20 shadow-lg backdrop-blur-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-indigo-300 shadow-lg shadow-indigo-600/20">
                <Server className="w-7 h-7" />
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">
            {appName}
          </h1>
          <p className="text-xs text-indigo-200/75 font-medium mt-1">
            {tagline}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mt-4">
            <span>Welcome Back</span>
            <span>👋</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 pt-4">
          <div className="mb-4 text-center">
            <h2 className="text-sm font-semibold text-slate-200">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access the central management console
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or username"
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer"
                />
                <span className="font-medium text-slate-300">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotNotice(true)}
                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center mb-2.5">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Password Reset Notice
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              For security compliance, please contact your <strong>System Administrator</strong> or IT Helpdesk to request a credential reset.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotNotice(false)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



