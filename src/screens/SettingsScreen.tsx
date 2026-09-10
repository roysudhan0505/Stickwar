import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Smartphone,
  Sliders,
  Bell,
  Database,
  User,
  LogOut,
  LogIn,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TopHeader } from '../components/layout/TopHeader';
import { StickwarButton } from '../components/ui/StickwarButton';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { sound } from '../utils/audio';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { settings, player } = state;

  const [usernameInput, setUsernameInput] = useState(player.username);
  const [editingUsername, setEditingUsername] = useState(false);
  const isCloudConnected = isSupabaseConfigured();

  const handleSaveUsername = () => {
    if (usernameInput.trim().length >= 3) {
      dispatch({ type: 'UPDATE_PROFILE', profile: { username: usernameInput.trim() } });
      setEditingUsername(false);
    }
  };

  const handleButtonSizeChange = (size: 'Small' | 'Medium' | 'Large') => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { buttonSize: size } });
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col pb-24">
      <TopHeader
        title="SETTINGS"
        showBackButton
        onBack={() => navigate('/home')}
      />

      <main className="max-w-md w-full mx-auto px-4 py-3 flex-1 space-y-4">
        {/* Account & Cloud Sync Section */}
        <section className="bg-[#16213E] p-4 rounded-2xl border-2 border-white/10 space-y-3 shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-tech text-xs text-[#FFD60A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Player Account
            </span>
            <span className="text-[10px] font-tech text-white/50 uppercase font-bold">
              {player.isGuest ? 'GUEST PROFILE' : 'AUTHENTICATED'}
            </span>
          </div>

          {/* Profile Name Edit */}
          <div className="flex items-center justify-between gap-3">
            {editingUsername ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="bg-[#1A1A2E] border border-[#FFD60A] px-3 py-1.5 rounded-lg text-sm font-tech text-white flex-1 outline-none"
                  maxLength={18}
                />
                <StickwarButton variant="accent" size="sm" onClick={handleSaveUsername}>
                  SAVE
                </StickwarButton>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="font-comic text-xl text-white">{player.username}</h4>
                  <p className="font-tech text-xs text-[#06D6A0]">{player.rank}</p>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setEditingUsername(true);
                  }}
                  className="text-xs font-tech font-bold text-[#FFD60A] hover:underline"
                >
                  Rename
                </button>
              </>
            )}
          </div>

          {/* Supabase Connection Status Card */}
          <div className="bg-[#1A1A2E] p-3 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database
                className={`w-5 h-5 ${isCloudConnected ? 'text-[#06D6A0]' : 'text-yellow-400'}`}
              />
              <div>
                <span className="font-tech font-bold text-xs text-white block">
                  Supabase Cloud Saves
                </span>
                <span className="font-tech text-[10px] text-white/60">
                  {isCloudConnected
                    ? 'Connected • Cloud Leaderboards Active'
                    : 'Local Cache Active (Credentials can be configured in .env)'}
                </span>
              </div>
            </div>

            {isCloudConnected ? (
              <CheckCircle className="w-5 h-5 text-[#06D6A0]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>

          {/* Auth Action */}
          <div>
            {player.isGuest ? (
              <StickwarButton
                variant="blood"
                fullWidth
                size="sm"
                icon={<LogIn className="w-4 h-4" />}
                onClick={() => navigate('/auth')}
              >
                Sign In / Link Account
              </StickwarButton>
            ) : (
              <StickwarButton
                variant="slate"
                fullWidth
                size="sm"
                icon={<LogOut className="w-4 h-4 text-[#E63946]" />}
                onClick={() => {
                  dispatch({
                    type: 'UPDATE_PROFILE',
                    profile: { isGuest: true, username: 'GuestWarrior#99' },
                  });
                }}
              >
                Log Out
              </StickwarButton>
            )}
          </div>
        </section>

        {/* Audio Section */}
        <section className="bg-[#16213E] p-4 rounded-2xl border-2 border-white/10 space-y-3.5 shadow-[3px_3px_0px_#000000]">
          <div className="border-b border-white/10 pb-2">
            <span className="font-tech text-xs text-[#FFD60A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Audio & Atmosphere
            </span>
          </div>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-tech text-sm text-white">Sound Effects (SFX)</span>
            <button
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  settings: { sfxEnabled: !settings.sfxEnabled },
                });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative border border-white/20 ${
                settings.sfxEnabled ? 'bg-[#06D6A0]' : 'bg-[#1A1A2E]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.sfxEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* BGM Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-tech text-sm text-white">Background Music (BGM)</span>
            <button
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  settings: { bgmEnabled: !settings.bgmEnabled },
                });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative border border-white/20 ${
                settings.bgmEnabled ? 'bg-[#06D6A0]' : 'bg-[#1A1A2E]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.bgmEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Gameplay & Controls Section */}
        <section className="bg-[#16213E] p-4 rounded-2xl border-2 border-white/10 space-y-3.5 shadow-[3px_3px_0px_#000000]">
          <div className="border-b border-white/10 pb-2">
            <span className="font-tech text-xs text-[#FFD60A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Virtual Touch Controls
            </span>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between">
            <span className="font-tech text-sm text-white">Haptic Vibration on Hits</span>
            <button
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  settings: { vibrationEnabled: !settings.vibrationEnabled },
                });
                sound.vibrate(40);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative border border-white/20 ${
                settings.vibrationEnabled ? 'bg-[#06D6A0]' : 'bg-[#1A1A2E]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.vibrationEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Control Button Size */}
          <div className="space-y-1.5">
            <span className="font-tech text-xs text-white/70 block">
              Virtual Button Scaling
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Small', 'Medium', 'Large'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleButtonSizeChange(s)}
                  className={`py-2 rounded-xl text-xs font-tech font-bold uppercase transition-all ${
                    settings.buttonSize === s
                      ? 'bg-[#FFD60A] text-[#1A1A2E] shadow-[2px_2px_0px_#000000]'
                      : 'bg-[#1A1A2E] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* PWA & Offline Installation Section */}
        <section className="bg-[#16213E] p-4 rounded-2xl border-2 border-white/10 space-y-3 shadow-[3px_3px_0px_#000000]">
          <div className="border-b border-white/10 pb-2 flex items-center justify-between">
            <span className="font-tech text-xs text-[#FFD60A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> PWA Installation & Offline
            </span>
            <span className="text-[10px] font-tech text-[#06D6A0] font-bold uppercase">
              Service Worker Active
            </span>
          </div>

          <p className="font-tech text-xs text-white/70">
            Install Stickwar directly to your home screen for instant full-screen launching and uninterrupted offline combat.
          </p>

          <PWAInstallButton variant="button" className="w-full" />
        </section>

        {/* App Info Footer */}
        <div className="text-center pt-2 pb-6 space-y-1">
          <p className="font-comic text-lg text-[#FFD60A]">STICKWAR PWA v1.0.0</p>
          <p className="font-tech text-xs text-white/40">
            Progressive Web App • Built for 60 FPS Mobile Combat
          </p>
        </div>
      </main>
    </div>
  );
};
