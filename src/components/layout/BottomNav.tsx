import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Swords, Trophy, Award, Settings } from 'lucide-react';
import { sound } from '../../utils/audio';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on gameplay screen or gameover
  if (location.pathname.startsWith('/game/')) {
    return null;
  }

  const tabs = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Play', path: '/worlds', icon: Swords },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Badges', path: '/achievements', icon: Award },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleTabClick = (path: string) => {
    sound.playClick();
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#16213E]/95 backdrop-blur-lg border-t-2 border-white/10 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            (tab.path === '/worlds' && location.pathname.startsWith('/worlds')) ||
            (tab.path === '/home' && (location.pathname === '/' || location.pathname === '/home'));

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 min-h-[48px] rounded-xl transition-all duration-150 active:scale-95 ${
                isActive ? 'text-[#FFD60A]' : 'text-[#F1F1F1]/50 hover:text-[#F1F1F1]/80'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FFD60A] rounded-full shadow-[0_0_6px_#FFD60A]" />
                )}
              </div>
              <span className={`text-[11px] font-tech font-bold uppercase tracking-wider mt-1 ${isActive ? 'text-[#FFD60A]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
