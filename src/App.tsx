import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { SplashScreen } from './screens/SplashScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AuthScreen } from './screens/AuthScreen';
import { WorldsScreen } from './screens/WorldsScreen';
import { StagesScreen } from './screens/StagesScreen';
import { BriefingScreen } from './screens/BriefingScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { CharactersScreen } from './screens/CharactersScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { BottomNav } from './components/layout/BottomNav';
import { DailyRewardModal } from './components/modals/DailyRewardModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  return (
    <GameProvider>
      <Router>
        <div className="min-h-screen bg-[#1A1A2E] text-[#F1F1F1] flex flex-col font-sans antialiased select-none">
          {/* Global Offline Status Indicator */}
          <OfflineIndicator />

          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/worlds" element={<WorldsScreen />} />
            <Route path="/worlds/:worldId/stages" element={<StagesScreen />} />
            <Route path="/worlds/:worldId/stages/:stageId/briefing" element={<BriefingScreen />} />
            <Route path="/game/:worldId/:stageId" element={<GameplayScreen />} />
            <Route path="/characters" element={<CharactersScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/achievements" element={<AchievementsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<NotFoundScreen />} />
          </Routes>

          {/* Persistent Floating Bottom Navigation */}
          <BottomNav />

          {/* Global Daily Reward Modal */}
          <DailyRewardModal />
        </div>
      </Router>
    </GameProvider>
  );
}
