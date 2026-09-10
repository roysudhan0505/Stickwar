import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { StickwarButton } from '../components/ui/StickwarButton';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { sound } from '../utils/audio';

export const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();

  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    sound.playClick();

    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        if (tab === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username: username || email.split('@')[0] },
            },
          });
          if (error) throw error;
          setSuccessMsg('Account created successfully! Migrating guest progress...');
          dispatch({
            type: 'UPDATE_PROFILE',
            profile: {
              isGuest: false,
              username: username || email.split('@')[0],
              email,
            },
          });
          setTimeout(() => navigate('/home'), 1200);
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          setSuccessMsg('Welcome back warrior!');
          dispatch({
            type: 'UPDATE_PROFILE',
            profile: {
              isGuest: false,
              username: data.user?.user_metadata?.username || email.split('@')[0],
              email,
            },
          });
          setTimeout(() => navigate('/home'), 1000);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    } else {
      // Local account simulation when Supabase env keys are pending
      setTimeout(() => {
        dispatch({
          type: 'UPDATE_PROFILE',
          profile: {
            isGuest: false,
            username: username || email.split('@')[0],
            email,
          },
        });
        setSuccessMsg('Profile created and saved locally!');
        setTimeout(() => navigate('/home'), 900);
        setLoading(false);
      }, 500);
    }
  };

  const handleContinueAsGuest = () => {
    sound.playClick();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <button
          onClick={handleContinueAsGuest}
          className="flex items-center gap-1 text-sm font-tech text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="font-tech text-xs text-[#FFD60A] uppercase font-bold">
          Account Gateway
        </span>
      </div>

      {/* Hero Title */}
      <div className="text-center my-4">
        <h1 className="font-comic text-5xl text-[#FFD60A] drop-shadow-[0_4px_0_#000000]">
          STICKWAR
        </h1>
        <p className="font-tech text-xs text-[#F1F1F1]/70 tracking-widest uppercase mt-1">
          Sync Your Battle Progress Everywhere
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-[#16213E] p-5 rounded-2xl border-2 border-[#FFD60A] shadow-[5px_5px_0px_#000000] space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-[#1A1A2E] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              sound.playClick();
              setTab('signup');
            }}
            className={`flex-1 py-2 rounded-lg font-tech font-bold text-xs uppercase transition-all ${
              tab === 'signup'
                ? 'bg-[#E63946] text-white shadow-[2px_2px_0px_#000000]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('signin');
            }}
            className={`flex-1 py-2 rounded-lg font-tech font-bold text-xs uppercase transition-all ${
              tab === 'signin'
                ? 'bg-[#E63946] text-white shadow-[2px_2px_0px_#000000]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="bg-[#E63946]/20 border border-[#E63946] p-2.5 rounded-xl flex items-center gap-2 text-xs font-tech text-[#F1F1F1]">
            <AlertCircle className="w-4 h-4 text-[#E63946] flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#06D6A0]/20 border border-[#06D6A0] p-2.5 rounded-xl flex items-center gap-2 text-xs font-tech text-[#06D6A0]">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-tech text-white/70 uppercase mb-1 font-bold">
                Warrior Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="e.g. IronShadow"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-sm font-tech text-white placeholder-white/30 focus:border-[#FFD60A] outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-tech text-white/70 uppercase mb-1 font-bold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <input
                type="email"
                placeholder="warrior@stickwar.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-sm font-tech text-white placeholder-white/30 focus:border-[#FFD60A] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-tech text-white/70 uppercase mb-1 font-bold">
              Secret Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-sm font-tech text-white placeholder-white/30 focus:border-[#FFD60A] outline-none"
                required
              />
            </div>
          </div>

          <StickwarButton
            variant="accent"
            fullWidth
            size="lg"
            type="submit"
            disabled={loading}
            className="mt-2"
          >
            {loading ? 'Processing...' : tab === 'signup' ? 'ENLIST WARRIOR' : 'ACCESS VAULT'}
          </StickwarButton>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={handleContinueAsGuest}
            className="text-xs font-tech text-white/60 hover:text-[#FFD60A] underline"
          >
            Skip for now & Continue as Guest
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[10px] font-tech text-white/40 py-2">
        Protected by Supabase Encryption • Cloud Synchronization
      </div>
    </div>
  );
};
