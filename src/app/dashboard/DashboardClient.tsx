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

  // 1. Recommendations & Spots State
  const [recommendedSpots, setRecommendedSpots] = useState<SpotModel[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  // 2. Engagement, Streaks & Gamified Stats
  const [engagement, setEngagement] = useState<EngagementSummary | null>(null);
  const [loadingEngagement, setLoadingEngagement] = useState(true);

  // 3. Recent Activities (Submissions, verifications, visits)
  const [recentActivities, setRecentActivities] = useState<SubmissionModel[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // 4. Voting Overview
  const [votingStatus, setVotingStatus] = useState<{
    voting_enabled: boolean;
    notice?: string;
    hasActiveProposal?: boolean;
    activeCount?: number;
  }>({ voting_enabled: false });

  // 5. XP Toast / Celebrations
  const [bonusXp, setBonusXp] = useState<number>(0);

  // Load Dashboard Data
  useEffect(() => {
    let isMounted = true;

    // Load recommendations
    async function loadRecommendations() {
      try {
        const res = await api.get('/spots?limit=20');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const allSpots: SpotModel[] = (res.data.data as any[]).map(normalizeSpot);
          // Prioritize spots with recommendation reasons or trending tags
          const recommended = allSpots.filter(
            (s: SpotModel) => (s.recommendationReasons && s.recommendationReasons.length > 0) || s.trendScore > 0
          );
          setRecommendedSpots(recommended.length >= 4 ? recommended.slice(0, 8) : allSpots.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load dashboard recommendations', err);
      } finally {
        if (isMounted) setLoadingSpots(false);
      }
    }

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

    loadRecommendations();
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
          {/* 1. HERO EXPEDITION BANNER & USER PROGRESSION OVERVIEW */}
          {/* ======================================================== */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1E4A38] text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-emerald-500/20">
            {/* Background Texture & Ambient Lights */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF9F5_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting & Summary */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB703]" />
                  <span>Pangasinan Sovereign Explorer Hub</span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                    {user?.displayName ? `Mabuhay, ${user.displayName}!` : 'Mabuhay, Pangasinan Explorer!'}
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                    Track your physical verified visits, round streaks, voting rights, and cultural discoveries across all 48 municipalities.
                  </p>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFB703] hover:bg-[#F59E0B] text-[#582F0E] text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#582F0E]" />
                    <span>Explore Feed</span>
                  </Link>

                  <Link
                    href="/map"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 backdrop-blur-xs transition active:scale-95 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <span>Open Interactive Map</span>
                  </Link>

                  <Link
                    href="/choice"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 backdrop-blur-xs transition active:scale-95 cursor-pointer"
                  >
                    <Vote className="w-4 h-4 text-amber-300" />
                    <span>JuanChoice Spotlight</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Gamified Progress & Streak Dashboard Card */}
              <div className="lg:col-span-5">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/15 p-5 sm:p-6 space-y-4">
                  {/* Streak & Level Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    {/* Explorer Tier */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#FFB703]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                          Explorer Tier
                        </span>
                        <span className="text-base font-black text-white">Level {explorerLevel}</span>
                      </div>
                    </div>

                    {/* Round Streak Counter */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-3 py-1.5 rounded-2xl">
                      <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div>
                        <div className="text-xs font-black text-amber-200">
                          {streakCount} {streakCount === 1 ? 'Round Streak' : 'Rounds Streak'}
                        </div>
                        <span className="text-[9px] text-amber-200/70 block">Civic participation</span>
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

                  {/* Mini Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-base font-black text-white block">{totalPoints}</span>
                      <span className="text-[9px] font-bold text-emerald-200/80 uppercase">Total XP</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-base font-black text-amber-300 block">{verifiedVisitsCount}</span>
                      <span className="text-[9px] font-bold text-emerald-200/80 uppercase">Verified Visits</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-base font-black text-white block">{municipalitiesExplored} / 48</span>
                      <span className="text-[9px] font-bold text-emerald-200/80 uppercase">Municipalities</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. PROMINENT MULTI-FUNCTIONAL EXPEDITION CALENDAR PANEL */}
          {/* ======================================================== */}
          <DashboardCalendar />

          {/* ======================================================== */}
          {/* 3. MAIN 2-COLUMN DASHBOARD GRID */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8-Column Area: Recommendations & Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* SECTION: Places You May Like / Recommendations */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2D6A4F] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#2C221E]">Places You May Like</h2>
                      <p className="text-xs text-[#837560]">Curated Pangasinan destinations tailored to your explorer profile</p>
                    </div>
                  </div>

                  <Link
                    href="/explore"
                    className="text-xs font-black text-[#2D6A4F] hover:underline flex items-center gap-1 group"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Recommended Spots Grid */}
                {loadingSpots ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-48 rounded-2xl bg-[#FAF9F5] border border-[#E3DFD5] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendedSpots.slice(0, 4).map((spot) => (
                      <article
                        key={spot.id}
                        className="group bg-white rounded-2xl border border-[#E3DFD5] overflow-hidden hover:border-[#2D6A4F]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      >
                        <div className="relative overflow-hidden bg-stone-100">
                          <DestinationMedia
                            src={spot.imageUrl}
                            alt={spot.name}
                            destinationName={spot.name}
                            municipality={spot.municipality}
                            aspectRatio="card"
                            className="group-hover:scale-103 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                              {spot.municipality}
                            </span>
                          </div>
                          {spot.recommendationReasons?.[0] && (
                            <div className="absolute bottom-2.5 left-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-[#2D6A4F] text-white text-[9px] font-black">
                                {spot.recommendationReasons[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-[#2C221E] group-hover:text-[#2D6A4F] transition-colors line-clamp-1">
                              {spot.name}
                            </h3>
                            <p className="text-xs text-[#6B5E4D] line-clamp-2 mt-1 leading-relaxed">
                              {spot.description || `Experience nature and community culture at ${spot.name}.`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-[#837560] font-semibold">
                              {spot.questId ? '🌿 Eco-Quest Attached' : '📍 Open Discovery'}
                            </span>
                            <Link
                              href={appRoutes.spot(spot.id)}
                              className="font-black text-[#2D6A4F] hover:underline flex items-center gap-1"
                            >
                              <span>Explore</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: Cultural Knowledge Quizzes (Migrated Here) */}
              <section className="space-y-4">
                <DashboardQuizCard onPass={handleQuizPassed} />
              </section>

              {/* SECTION: JuanChoice Community Spotlight Rail */}
              <section className="space-y-4">
                <JuanChoiceRail />
              </section>
            </div>

            {/* Right 4-Column Area: Highlights, Voting Status & Recent Activities */}
            <div className="lg:col-span-4 space-y-6">
              {/* Hidden Gems Highlights Card */}
              <HiddenGemHighlights className="rounded-3xl border border-[#E3DFD5] bg-white p-5 sm:p-6 shadow-xs min-w-0" />

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
