import React, { useState } from 'react';
import { Server, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { verifySupabaseCredentials } from '../lib/supabase';

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
  tagline = 'Enterprise Management Suite',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await verifySupabaseCredentials(email, password);
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      setErrorMsg(res.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full transition-colors">
        <div className="text-center mb-6">
          {appLogo ? (
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src={appLogo}
                alt={appName}
                className="w-16 h-16 rounded-xl object-contain bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 p-1.5 shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-lg mb-3">
              <Server className="w-6 h-6" />
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
            {appName || 'BBL DM System'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tagline || 'Enterprise Management Suite'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Email / Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2.5 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none"
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

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-600"
              />
              <span>Remember Me</span>
            </label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Contact System Administrator for password reset.');
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-2.5 rounded transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              'Login to System'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

