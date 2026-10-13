'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  Sparkles,
  Trophy,
  Flame,
  Award,
  Vote,
  Zap,
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
  Clock,
  ChevronRight,
  Users,
  ShieldCheck,
  Smartphone,
  Eye,
  PlusCircle,
  HelpCircle,
  Activity,
  Layers,
  Heart,
  Calendar,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { api, SpotModel, normalizeSpot, SubmissionModel, normalizeSubmission } from '@/lib/api';
import { fetchMyEngagement, EngagementSummary } from '@/lib/engagement';
import { DestinationMedia } from '@/components/DestinationMedia';
import { HiddenGemHighlights } from '@/components/HiddenGemHighlights';
import { JuanChoiceRail } from '@/components/JuanChoiceRail';
import { DashboardQuizCard } from '@/components/DashboardQuizCard';
import { DashboardCalendar } from '@/components/DashboardCalendar';
import { triggerCelebration } from '@/components/CelebrationEffects';
import { appRoutes } from '@/lib/routes';

export function DashboardClient() {
  const { user } = useAuth();

  // 1. Engagement, Streaks & Gamified Stats
  const [engagement, setEngagement] = useState<EngagementSummary | null>(null);
  const [loadingEngagement, setLoadingEngagement] = useState(true);

  // 2. Recent Activities (Submissions, verifications, visits)
  const [recentActivities, setRecentActivities] = useState<SubmissionModel[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // 3. Voting Overview
  const [votingStatus, setVotingStatus] = useState<{
    voting_enabled: boolean;
    notice?: string;
    hasActiveProposal?: boolean;
    activeCount?: number;
  }>({ voting_enabled: false });

  // 4. XP Toast / Celebrations
  const [bonusXp, setBonusXp] = useState<number>(0);

  // Load Dashboard Data
  useEffect(() => {
    let isMounted = true;

    // Load engagement / streaks / progress
    async function loadUserEngagement() {
      if (!user) {
        if (isMounted) setLoadingEngagement(false);
        return;
      }
      try {
        const data = await fetchMyEngagement();
        if (isMounted) setEngagement(data);
      } catch (err) {
        console.error('Failed to load engagement', err);
      } finally {
        if (isMounted) setLoadingEngagement(false);
      }
    }

    // Load recent activities
    async function loadActivities() {
      if (!user) {
        if (isMounted) setLoadingActivities(false);
        return;
      }
      try {
        const res = await api.get('/submissions');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setRecentActivities(res.data.data.slice(0, 5).map(normalizeSubmission));
        }
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        if (isMounted) setLoadingActivities(false);
      }
    }

    // Load voting availability
    async function loadVotingInfo() {
      try {
        const [overviewRes, proposalsRes] = await Promise.allSettled([
          api.get('/juanchoice/overview', { timeout: 4000 }),
          api.get('/proposals', { timeout: 4000 }),
        ]);

        let enabled = false;
        let noticeMsg = 'Voting window is currently closed';
        let activeProposalCount = 0;

        if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
          const avail = overviewRes.value.data.data?.availability;
          enabled = Boolean(avail?.voting_enabled);
          if (overviewRes.value.data.data?.notice?.message) {
            noticeMsg = overviewRes.value.data.data.notice.message;
          }
        }

        if (proposalsRes.status === 'fulfilled' && proposalsRes.value.data?.success) {
          const list = proposalsRes.value.data.data;
          if (Array.isArray(list)) {
            activeProposalCount = list.filter((p: any) => p.state === 'voting' || p.state === 'active').length;
          }
        }

        if (isMounted) {
          setVotingStatus({
            voting_enabled: enabled,
            notice: noticeMsg,
            hasActiveProposal: activeProposalCount > 0,
            activeCount: activeProposalCount,
          });
        }
      } catch {
        // keep fallback
      }
    }

    loadUserEngagement();
    loadActivities();
    loadVotingInfo();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Gamification Level calculations
  const totalPoints = (user?.points || 0) + bonusXp;
  const explorerLevel = Math.max(1, Math.floor(totalPoints / 50) + 1);
  const currentLevelProgress = Math.min(100, Math.round(((totalPoints % 50) / 50) * 100));
  const streakCount = engagement?.streak?.current ?? 1;
  const verifiedVisitsCount = engagement?.impact?.verified_visits ?? 0;
  const municipalitiesExplored = engagement?.impact?.municipalities ?? 1;

  const handleQuizPassed = (xp: number) => {
    setBonusXp((prev) => prev + xp);
    triggerCelebration({ type: 'poppers', playAudio: true });
  };

  return (
    <Navigation>
      <ErrorBoundary fallbackTitle="Unable to load Explorer Dashboard">
        <div className="max-w-7xl 2xl:max-w-[1560px] mx-auto space-y-8 pb-16">
          {/* ======================================================== */}
          {/* 1. TOP ASYMMETRIC ROW: EXPLORER PROGRESSION + EXPEDITION CALENDAR */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            {/* Explorer Summary Overview Panel (Level, Streak, XP, Verified Visits) */}
            <div className="xl:col-span-5 flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1E4A38] text-white p-5 sm:p-6 shadow-md border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                {/* Header Badge & Level */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-[#FFB703]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                        Explorer Overview
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-white">Level {explorerLevel} Tier</h2>
                    </div>
                  </div>

                  {/* Round Streak Counter */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-3 py-1.5 rounded-2xl">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                    <div>
                      <span className="text-xs font-black text-amber-200 block leading-tight">
                        {streakCount} {streakCount === 1 ? 'Streak' : 'Streaks'}
                      </span>
                      <span className="text-[9px] text-amber-200/70 block leading-tight">DAO Round</span>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
                    <span>XP to Level {explorerLevel + 1}</span>
                    <span className="font-mono text-amber-300">{totalPoints % 50} / 50 XP ({currentLevelProgress}%)</span>
                  </div>
                  <div className="w-full bg-white/15 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#FFB703] to-[#F59E0B] h-full rounded-full transition-all duration-500 shadow-2xs"
                      style={{ width: `${Math.max(6, currentLevelProgress)}%` }}
                    />
                  </div>
                </div>

                {/* Mini Stats 3-Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <span className="text-base sm:text-lg font-black text-white block leading-tight">{totalPoints}</span>
                    <span className="text-[9px] font-bold text-emerald-200/90 uppercase tracking-wider">Total XP</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <span className="text-base sm:text-lg font-black text-amber-300 block leading-tight">{verifiedVisitsCount}</span>
                    <span className="text-[9px] font-bold text-emerald-200/90 uppercase tracking-wider">Verified Visits</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <span className="text-base sm:text-lg font-black text-white block leading-tight">{municipalitiesExplored} / 48</span>
                    <span className="text-[9px] font-bold text-emerald-200/90 uppercase tracking-wider">LGUs Visited</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action Chips */}
              <div className="relative z-10 pt-4 mt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                <Link
                  href="/explore"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFB703] hover:bg-[#F59E0B] text-[#582F0E] text-xs font-black shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#582F0E]" />
                  <span>Feed</span>
                </Link>

                <Link
                  href="/map"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Map</span>
                </Link>

                <Link
                  href="/choice"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition active:scale-95 cursor-pointer"
                >
                  <Vote className="w-3.5 h-3.5 text-amber-300" />
                  <span>Vote</span>
                </Link>
              </div>
            </div>

            {/* Compressed Expedition Calendar Panel */}
            <div className="xl:col-span-7">
              <DashboardCalendar />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. MAIN 2-COLUMN DASHBOARD GRID */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8-Column Area: Recommendations & Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* SECTION: Cultural Knowledge Quizzes (Migrated Here) */}
              <section className="space-y-4">
                <DashboardQuizCard onPass={handleQuizPassed} />
              </section>

              {/* SECTION: JuanChoice Community Spotlight Rail */}
              <section className="space-y-4">
                <JuanChoiceRail />
              </section>
            </div>

            {/* Right 4-Column Area: Hidden Gems, Voting Status & Recent Activities */}
            <div className="lg:col-span-4 space-y-6">
              {/* Standalone Hidden Gems Discovery Panel */}
              <HiddenGemHighlights />

              {/* Voting Availability Card */}
              <div className="bg-white rounded-3xl border border-[#E3DFD5] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <Vote className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#2C221E]">Community Voting</h3>
                      <p className="text-[10px] text-[#837560]">JuanChoice &amp; Municipal DAO</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    votingStatus.voting_enabled
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {votingStatus.voting_enabled ? 'Active Round' : 'Between Rounds'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E3DFD5]/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#582F0E]">
                    <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>{votingStatus.notice || 'Round finalizing or between cycles.'}</span>
                  </div>
                  <p className="text-[11px] text-[#837560] leading-relaxed">
                    Participation in JuanChoice rounds increases your Round Streak counter and unlocks prestigious civic explorer badges.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/choice"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition shadow-2xs group cursor-pointer"
                  >
                    <span>Open JuanChoice Voting</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/vote"
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition border border-stone-200/80 group cursor-pointer"
                  >
                    <span>View Archived Proposals</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                </div>
              </div>

              {/* Recent Activities & Submissions Card */}
              <div className="bg-white rounded-3xl border border-[#E3DFD5] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#2D6A4F] flex items-center justify-center">
                      <Activity className="w-4 h-4 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#2C221E]">Recent Activities</h3>
                      <p className="text-[10px] text-[#837560]">Your verified proofs &amp; trails</p>
                    </div>
                  </div>

                  <Link
                    href="/history"
                    className="text-[11px] font-bold text-[#2D6A4F] hover:underline"
                  >
                    All history
                  </Link>
                </div>

                {loadingActivities ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-stone-50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#837560] space-y-2">
                    <History className="w-8 h-8 mx-auto text-stone-300" />
                    <p>No recent submissions yet.</p>
                    <Link
                      href="/quests"
                      className="inline-block text-[#2D6A4F] font-bold hover:underline"
                    >
                      Complete a quest on mobile ↗
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E3DFD5]/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#2C221E] truncate block">
                            {act.questTitle}
                          </span>
                          <span className="text-[10px] text-[#837560] block">
                            Pangasinan · {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                          act.status === 'approved'
                            ? 'bg-emerald-100 text-[#2D6A4F]'
                            : act.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {act.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Navigation>
  );
}
