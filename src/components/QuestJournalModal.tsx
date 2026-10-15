'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { triggerCelebration } from '@/components/CelebrationEffects';

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: string;
  category: 'daily' | 'milestone' | 'eco';
  xpReward: number;
  isClaimed?: boolean;
}

interface QuestJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  treesPlanted: number;
}

export function QuestJournalModal({
  isOpen,
  onClose,
  treesPlanted,
}: QuestJournalModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'milestones'>('all');
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const quests: QuestItem[] = [
    {
      id: 'quest-eco-stars',
      title: 'Reach 5-Star Eco-Rating on Island',
      description: 'Keep Pangasinan pristine by completing coastal cleanups and eco-tours.',
      progress: 4,
      total: 5,
      icon: '⭐',
      category: 'milestone',
      xpReward: 150,
    },
    {
      id: 'quest-mangroves',
      title: 'Plant 100 Mangrove Trees in Bani',
      description: 'Support local biodiversity by planting native mangroves along Tambac Bay.',
      progress: Math.min(100, treesPlanted),
      total: 100,
      icon: '🌲',
      category: 'eco',
      xpReward: 200,
    },
    {
      id: 'quest-specialties',
      title: 'Collect all Pangasinan Specialties',
      description: 'Discover authentic local Bangus, Tupig, Alaminos Longganisa, and Buri craft spots.',
      progress: 210,
      total: 602,
      icon: '📦',
      category: 'milestone',
      xpReward: 350,
    },
    {
      id: 'quest-marine-sanctuaries',
      title: 'Discover 80 Marine Sanctuaries',
      description: 'Explore verified marine reserves across Bolinao, Alaminos, and Anda.',
      progress: 43,
      total: 80,
      icon: '🐟',
      category: 'milestone',
      xpReward: 250,
    },
    {
      id: 'quest-party-invite',
      title: 'Invite 10 Fellow JuanDerers',
      description: 'Assemble an expedition party with fellow travelers exploring Pangasinan.',
      progress: 8,
      total: 10,
      icon: '🤝',
      category: 'daily',
      xpReward: 100,
    },
    {
      id: 'quest-lucap-checkin',
      title: 'Check in at Lucap Wharf Harbor',
      description: 'Register GPS arrival at the gateway to the Hundred Islands National Park.',
      progress: 1,
      total: 1,
      icon: '⛵',
      category: 'daily',
      xpReward: 50,
    },
  ];

  const filteredQuests = quests.filter((q) => {
    if (activeTab === 'daily') return q.category === 'daily';
    if (activeTab === 'milestones') return q.category === 'milestone' || q.category === 'eco';
    return true;
  });

  const handleClaim = (quest: QuestItem) => {
    if (!claimedQuestIds.includes(quest.id)) {
      setClaimedQuestIds((prev) => [...prev, quest.id]);
      triggerCelebration({ type: 'confetti', count: 40, playAudio: true });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#FAF7F0] border-4 border-[#8C5E35] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#2D3A2F] relative animate-in zoom-in-95 duration-150"
      >
        {/* Top Wood Header Plaque */}
        <div className="bg-gradient-to-r from-[#8C5E35] via-[#7B4E28] to-[#603816] text-[#FFF6E5] px-5 py-4 border-b-3 border-[#4A260F] flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl drop-shadow-sm">📜</span>
            <div>
              <h3 id="quest-modal-title" className="font-black text-lg tracking-tight leading-none text-[#FFF6E5]">
                Expedition Quest Journal
              </h3>
              <p className="text-[11px] text-[#F3D7A5] font-semibold mt-0.5">
                Pangasinan Island Objectives &amp; Milestone Rewards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Quest Journal"
            className="w-8 h-8 rounded-full bg-[#3D1E0B]/60 hover:bg-[#3D1E0B] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quest Filter Tabs */}
        <div className="bg-[#EFEAE0] px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#DFD7C7] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Quests', count: quests.length },
              { id: 'daily', label: 'Daily (24h)', count: 2 },
              { id: 'milestones', label: 'Milestones', count: 4 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'daily' | 'milestones')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-[#245C36] text-white shadow-xs scale-102'
                    : 'bg-[#FAF7F0] text-[#55695A] hover:bg-[#E3DCce]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#DFD7C7] text-[#55695A]'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[10px] font-bold text-[#8C5E35] shrink-0 hidden sm:inline">
            Resets in 14h ⏰
          </span>
        </div>

        {/* Scrollable Quest Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredQuests.map((quest) => {
            const isCompleted = quest.progress >= quest.total;
            const isClaimed = claimedQuestIds.includes(quest.id);
            const pct = Math.min(100, Math.round((quest.progress / quest.total) * 100));

            return (
              <div
                key={quest.id}
                className="bg-[#FAF7F0] rounded-2xl p-4 sm:p-4.5 border border-[#E3DCce] hover:border-[#8C5E35]/40 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#EFEAE0] border border-[#DFD7C7] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      {quest.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#1F452C] leading-tight">
                        {quest.title}
                      </h4>
                      <p className="text-[11px] text-[#5D6B5F] mt-0.5 line-clamp-2 leading-relaxed">
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-600" /> +{quest.xpReward} XP
                  </span>
                </div>

                {/* Progress Meter Bar */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span className="text-[#6B5A47]">
                      Progress: <strong className="text-[#1F452C]">{quest.progress}</strong> / {quest.total}
                    </span>
                    <span className="text-[#8C5E35] font-black">{pct}%</span>
                  </div>

                  <div className="w-full bg-[#DFD7C7] h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-400 to-[#245C36]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Action button if complete or in-progress */}
                <div className="mt-3 pt-2 border-t border-[#EFEAE0] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8E9B90]">
                    {isCompleted ? 'Objective Fulfilled! 🎉' : 'In Progress • Active Expedition'}
                  </span>

                  {isCompleted ? (
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={isClaimed}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        isClaimed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#2B3B2E] shadow-xs hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Claimed</span>
                        </>
                      ) : (
                        <>
                          <span>Claim Reward (+{quest.xpReward} XP)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/quests"
                      onClick={onClose}
                      className="text-[11px] font-bold text-[#245C36] hover:underline flex items-center gap-1"
                    >
                      <span>Quest Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#EFEAE0] p-3 px-5 border-t border-[#DFD7C7] flex items-center justify-between text-xs">
          <span className="text-[#55695A] font-semibold text-[11px]">
            Total Quests Completed: <strong className="text-[#1F452C]">1 / {quests.length}</strong>
          </span>
          <Link
            href="/quests"
            onClick={onClose}
            className="font-extrabold text-[#245C36] hover:underline flex items-center gap-1"
          >
            <span>View Full Quest Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
