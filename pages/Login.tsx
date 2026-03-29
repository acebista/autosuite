import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, Key, Mail, AlertCircle, Sparkles, Car, Wrench,
  Building2, ChevronDown, CheckCircle2, User, Lock
} from 'lucide-react';
import { Role, UserProfile } from '../types';

type Step = 'credentials' | 'dealer';

const Login: React.FC = () => {
  const { verifyCredentials, selectDealerAndLogin, loginWithRole, isLoading, availableProfiles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedProfile = availableProfiles?.find(p => p.id === selectedProfileId) ?? null;

  // STEP 1: Verify credentials only
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await verifyCredentials(email, password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // Credentials valid — move to dealer selection step
    if (result.profiles && result.profiles.length > 0) {
      // Auto-select if only one dealer
      if (result.profiles.length === 1) {
        setSelectedProfileId(result.profiles[0].id);
      }
      setStep('dealer');
    }

    setIsSubmitting(false);
  };

  // STEP 2: Complete login with selected dealer
  const handleDealerLogin = async () => {
    if (!selectedProfile) {
      setError('Please select a dealership to continue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    await selectDealerAndLogin(selectedProfile);
    navigate(from, { replace: true });
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setSelectedProfileId('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-teal/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-deepal-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-deepal-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute top-1/4 left-1/4 opacity-10 animate-float">
          <Car size={48} className="text-white" />
        </div>
        <div className="absolute bottom-1/3 right-1/4 opacity-10 animate-float" style={{ animationDelay: '2s' }}>
          <Wrench size={40} className="text-white" />
        </div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-accent-teal to-deepal-500 rounded-3xl flex items-center justify-center shadow-glow-teal transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <span className="font-display font-bold text-4xl text-white">A</span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse-glow">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold text-white tracking-tight">AutoSuite AI</h1>
          <p className="text-surface-400 font-medium text-sm mt-3 tracking-wide">
            Dealership Operating System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-dark rounded-3xl shadow-elevated border border-white/10 overflow-hidden">
          <div className="p-6">
            {/* ── STEP 1: EMAIL + PASSWORD ── */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-surface-400 tracking-wide mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input
                      type="email"
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal/50 transition-all"
                      placeholder="you@dealership.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-400 tracking-wide mb-2 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input
                      type="password"
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-accent-teal to-deepal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-glow-teal mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Next — Select Dealership
                      <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: DEALER SELECTION ── */}
            {step === 'dealer' && availableProfiles && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                  <div className="h-10 w-10 bg-accent-teal/10 rounded-xl flex items-center justify-center border border-accent-teal/20">
                    <Building2 className="text-accent-teal" size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Select Dealership</h2>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {availableProfiles.length} dealership{availableProfiles.length > 1 ? 's' : ''} linked to your account
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-surface-400 tracking-wide mb-2 ml-1">
                    Choose a Dealership
                  </label>
                  <button
                    type="button"
                    id="dealer-dropdown"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-accent-teal/40 transition-all text-left"
                  >
                    {selectedProfile ? (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-accent-teal to-deepal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {selectedProfile.orgLogo
                            ? <img src={selectedProfile.orgLogo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                            : selectedProfile.orgName?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{selectedProfile.orgName || 'Unknown Dealer'}</p>
                          <p className="text-xs text-surface-500">{selectedProfile.role} · {selectedProfile.orgSlug}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-surface-500 flex items-center gap-3">
                        <Building2 size={18} />
                        Select a dealership...
                      </span>
                    )}
                    <ChevronDown
                      size={18}
                      className={`text-surface-500 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full z-30 bg-surface-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {availableProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setSelectedProfileId(profile.id);
                            setIsDropdownOpen(false);
                            setError(null);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-gradient-to-br from-surface-600 to-surface-800 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {profile.orgLogo
                                ? <img src={profile.orgLogo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                : profile.orgName?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{profile.orgName || 'Unknown Dealer'}</p>
                              <p className="text-xs text-surface-500">{profile.role} · {profile.orgSlug}</p>
                            </div>
                          </div>
                          {selectedProfileId === profile.id && (
                            <CheckCircle2 size={16} className="text-accent-teal flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Login Button */}
                <button
                  type="button"
                  id="dealer-login-btn"
                  onClick={handleDealerLogin}
                  disabled={!selectedProfile || isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-accent-teal to-deepal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-teal"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShieldCheck size={18} />
                      Enter {selectedProfile?.orgName || 'Dealership'}
                    </span>
                  )}
                </button>

                {/* Back */}
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full text-sm text-surface-500 hover:text-white transition-colors py-1"
                >
                  ← Use a different account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-xs text-surface-500 leading-loose">
            <span className="block font-semibold mb-1">Secure Multi-Tenant Environment</span>
            <span className="text-surface-600">© 2026 AutoSuite AI Inc.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
