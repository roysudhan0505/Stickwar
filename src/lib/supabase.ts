import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * SQL Schema Migration script for Supabase Database.
 * Run this in your Supabase Project's SQL Editor to bootstrap all Stickwar tables and policies.
 */
export const SUPABASE_SQL_SCHEMA = `
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'ninja',
  total_kills INT DEFAULT 0,
  stages_cleared INT DEFAULT 0,
  gold_coins INT DEFAULT 100,
  rank TEXT DEFAULT 'Bronze Warrior',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stage Progress Table
CREATE TABLE IF NOT EXISTS public.stage_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id INT NOT NULL,
  stage_id INT NOT NULL,
  stars INT DEFAULT 0,
  best_score INT DEFAULT 0,
  best_time FLOAT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, world_id, stage_id)
);

-- 3. Character Inventory & Upgrades Table
CREATE TABLE IF NOT EXISTS public.character_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT false,
  shards INT DEFAULT 0,
  atk_tier INT DEFAULT 0,
  def_tier INT DEFAULT 0,
  spd_tier INT DEFAULT 0,
  ability_tier INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- 4. Leaderboard Scores Table
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT DEFAULT 'ninja',
  total_score INT DEFAULT 0,
  stages_cleared INT DEFAULT 0,
  best_boss_clear_time FLOAT DEFAULT 0,
  weekly_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. User Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  progress INT DEFAULT 0,
  claimed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 6. Daily Rewards Table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INT DEFAULT 1,
  last_claimed_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboards and profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public leaderboard viewable by everyone" ON public.leaderboard_scores FOR SELECT USING (true);
CREATE POLICY "Users can manage their own leaderboard scores" ON public.leaderboard_scores FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their stage progress" ON public.stage_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their character inventory" ON public.character_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their daily rewards" ON public.daily_rewards FOR ALL USING (auth.uid() = user_id);
`;
