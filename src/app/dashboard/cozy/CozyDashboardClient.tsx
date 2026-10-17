'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Sparkles,
  Search,
  Bell,
  Calendar as CalendarIcon,
  ChevronRight,
  X,
  LayoutGrid,
  Compass,
  Zap,
  ShoppingBag,
  BookOpen,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MiniMapPreview } from '@/components/MiniMapPreview';
import { SAMPLE_USER_BADGES, UserBadge } from '@/lib/badges';
import { triggerCelebration } from '@/components/CelebrationEffects';
import { QuestJournalModal } from '@/components/QuestJournalModal';

// Eco tips pool tailored for Pangasinan and Leave No Trace
const ECO_TIPS = [
  'Plant more native mangroves in Bani to increase your Island Eco-Rating to 5 stars! 🌿',
  'Always pack out all trash when hopping across Hundred Islands. Keep marine sanctuaries pristine! 🐢',
  'Support verified Pangasinan MSMEs in Dagupan and Alaminos to boost local community livelihoods! 🐟',
  'Take only photos and leave only footprints along Bolinao and Patar white sand beaches. 🏖️',
  'Respect coral reefs: Use reef-safe sunscreen when swimming around Governor’s Island! 🐠',
  'Choose local eco-certified boats at Lucap Wharf for lower carbon coastal navigation. ⛵',
];

// Sidebar navigation items (User requested: Overview, Explore, Interactive Map, Quest, JuanChoice, Shop, About Project, Settings — no Home)
const SIDEBAR_NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: '🍃', iconName: 'LayoutGrid', active: true },
  { label: 'Explore', href: '/explore', icon: '🧭', iconName: 'Compass', active: false },
  { label: 'Interactive Map', href: '/map', icon: '🗺️', iconName: 'MapPin', active: false },
  { label: 'Quest', href: '/quests', icon: '📜', iconName: 'Zap', active: false },
  { label: 'JuanChoice', href: '/community-choice', icon: '✨', iconName: 'Sparkles', active: false },
  { label: 'Shop', href: '/shop', icon: '🛍️', iconName: 'ShoppingBag', active: false },
  { label: 'About Project', href: '/about', icon: '📖', iconName: 'BookOpen', active: false },
  { label: 'Settings', href: '/settings', icon: '⚙️', iconName: 'Settings', active: false },
];

// Pre-registered expeditions and events
interface RegisteredEvent {
  id: string;
  day: number;
  month: string;
  year: number;
  title: string;
  time: string;
  location: string;
  participants: number;
  maxParticipants: number;
  description: string;
  isRegistered: boolean;
  category: 'festival' | 'eco_quest' | 'cultural';
}

const REGISTERED_EVENTS: RegisteredEvent[] = [
  {
    id: 'ev-1',
    day: 18,
    month: 'Oct',
    year: 2026,
    title: 'Dagupan Bangus Festival & Coastal Grill',
    time: '17:00 PM',
    location: 'Bonuan Tondaligan Beach, Dagupan',
    participants: 412,
    maxParticipants: 500,
    description: 'Pre-registered celebration honoring Pangasinan milkfish with culinary grill stations and cultural dances.',
    isRegistered: true,
    category: 'festival',
  },
  {
    id: 'ev-2',
    day: 20,
    month: 'Oct',
    year: 2026,
    title: 'Hundred Islands Marine Sanctuary Eco-Run',
    time: '08:00 AM',
    location: 'Lucap Wharf, Alaminos City',
    participants: 128,
    maxParticipants: 150,
    description: 'Island hopping kayak expedition and coral reef clean-up with marine biology guides.',
    isRegistered: true,
    category: 'eco_quest',
  },
  {
    id: 'ev-3',
    day: 26,
    month: 'Oct',
    year: 2026,
    title: 'Pista’y Dayat Coastal Thanksgiving Parade',
    time: '09:30 AM',
    location: 'Lingayen Capitol Baywalk, Lingayen',
    participants: 840,
    maxParticipants: 1000,
    description: 'Provincial sea festival showcasing traditional outrigger boats, sand sculpting, and folk music.',
    isRegistered: true,
    category: 'cultural',
  },
  {
    id: 'ev-4',
    day: 26,
    month: 'Oct',
    year: 2026,
    title: 'Lingayen Gulf Sunset Sand Sculpting Showcase',
    time: '16:00 PM',
    location: 'Lingayen Beachfront Park',
    participants: 190,
    maxParticipants: 250,
    description: 'Artisan sand castle contest and coastal night bazaar with live acoustic folk music.',
    isRegistered: true,
    category: 'festival',
  },
  {
    id: 'ev-5',
    day: 26,
    month: 'Oct',
    year: 2026,
    title: 'Capitol Heritage Trail Walking Tour',
    time: '18:30 PM',
    location: 'Pangasinan Provincial Capitol Grounds',
    participants: 75,
    maxParticipants: 100,
    description: 'Guided evening walking quest covering neoclassical architecture and local folklore.',
    isRegistered: true,
    category: 'cultural',
  },
];

export function CozyDashboardClient() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [selectedTipIndex, setSelectedTipIndex] = useState(0);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [currentTime, setCurrentTime] = useState('10:45 AM');

  // Sidebar Expand/Collapse State (persisted to localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('juander_sidebar_collapsed');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // Ignore storage errors
      }
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('juander_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Gamified Quest Modal & Activity Tab State
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'badges' | 'voting' | 'perks'>('badges');

  // Keep live time ticking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click-outside listener for notifications dropdown
  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const totalPoints = user?.points || 1250;
  const treesPlanted = 68;

  // Events based on selected calendar day (empty array if no events on that day)
  const selectedDayEvents = useMemo(() => {
    return REGISTERED_EVENTS.filter((e) => e.day === selectedCalendarDay);
  }, [selectedCalendarDay]);

  const [claimedPerks, setClaimedPerks] = useState<string[]>([]);
  const [voucherToast, setVoucherToast] = useState<{ title: string; code: string } | null>(null);

  const handleNextTip = () => {
    setSelectedTipIndex((prev) => (prev + 1) % ECO_TIPS.length);
    triggerCelebration({ type: 'confetti', count: 18, playAudio: false });
  };

  const handleClaimPerk = (code: string, title: string) => {
    if (!claimedPerks.includes(code)) {
      setClaimedPerks((prev) => [...prev, code]);
      setVoucherToast({ title, code });
      triggerCelebration({ type: 'confetti', count: 30, playAudio: true });
      setTimeout(() => setVoucherToast(null), 4500);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F4EFE6] text-[#2D3A2F] flex flex-col antialiased selection:bg-[#5B8E67] selection:text-white"
      style={{ fontFamily: '"Quicksand", var(--font-quicksand), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto flex flex-col md:flex-row gap-6 p-3 sm:p-5 lg:p-7">
        {/* =========================================================== */}
        {/* LEFT SIDEBAR (Expandable / Collapsible Animal Crossing Style) */}
        {/* =========================================================== */}
        {isSidebarCollapsed ? (
          /* --------------------------------------------------------- */
          /* COLLAPSED RAIL SIDEBAR (Same dark green color as expanded) */
          /* --------------------------------------------------------- */
          <aside className="self-start shrink-0 flex flex-col items-center bg-[#244E36] border-2 border-[#1B3F2B] text-[#E0EEDF] rounded-3xl py-4 px-2 shadow-xl transition-all duration-300 w-full md:w-[72px] md:sticky md:top-6 gap-3">
            {/* Top Section: Logo & Toggle */}
            <div className="flex flex-row md:flex-col items-center gap-2 w-full justify-between md:justify-start">
              {/* JuanDer Mascot Logo */}
              <Link
                href="/dashboard"
                title="JuanDer Without Limits — Island Hub"
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#306346] bg-[#FAF7F0] flex items-center justify-center shadow-xs hover:scale-105 transition-all"
              >
                <Image
                  src="/cozy/juander_mascot.jpg"
                  alt="JuanDer Mascot Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Horizontal Divider (desktop only) */}
              <div className="hidden md:block w-8 h-px bg-[#1B3F2B] my-1" />

              {/* Expand Toggle Button */}
              <button
                onClick={toggleSidebar}
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
                className="w-10 h-10 rounded-full bg-[#1B3F2B] hover:bg-[#2F6144] text-[#E0EEDF] flex items-center justify-center border border-[#306346] shadow-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                {/* Book / Panel icon with chevron right */}
                <svg
                  className="w-5 h-5 text-[#E0EEDF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
                  <path d="M9 3.5v17" />
                  <path d="M12 9.5l3 2.5-3 2.5" />
                </svg>
              </button>

              {/* Horizontal Divider (desktop only) */}
              <div className="hidden md:block w-8 h-px bg-[#1B3F2B] my-1" />
            </div>

            {/* Middle Section: Vertical Icons for the 8 requested items */}
            <nav className="flex flex-row md:flex-col items-center gap-2 my-2 overflow-x-auto md:overflow-visible w-full justify-center">
              {SIDEBAR_NAV_ITEMS.map((item, idx) => {
                const IconComp =
                  item.iconName === 'Compass'
                    ? Compass
                    : item.iconName === 'MapPin'
                    ? MapPin
                    : item.iconName === 'Zap'
                    ? Zap
                    : item.iconName === 'Sparkles'
                    ? Sparkles
                    : item.iconName === 'ShoppingBag'
                    ? ShoppingBag
                    : item.iconName === 'BookOpen'
                    ? BookOpen
                    : item.iconName === 'Settings'
                    ? Settings
                    : LayoutGrid;

                if (item.active) {
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      title={item.label}
                      className="w-11 h-11 rounded-full bg-[#FAF7F0] text-[#1F452C] relative flex items-center justify-center shadow-md transition-all hover:scale-105 shrink-0"
                    >
                      <LayoutGrid className="w-5 h-5 text-[#1F452C]" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={idx}
                    href={item.href}
                    title={item.label}
                    className="w-10 h-10 rounded-xl hover:bg-[#2C5E42] text-[#DCE8DC] hover:text-white flex items-center justify-center transition-all hover:scale-105 shrink-0"
                  >
                    <IconComp className="w-5 h-5" />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Section: Profile Avatar */}
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#1B3F2B] w-full">
              <Link
                href="/profile"
                title={user?.name || 'Explorer Profile'}
                className="w-10 h-10 rounded-full bg-[#1B3F2B] border-2 border-[#306346] text-[#E0EEDF] flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-all overflow-hidden"
              >
                {user?.name?.[0]?.toUpperCase() || 'J'}
              </Link>
            </div>
          </aside>
        ) : (
          /* --------------------------------------------------------- */
          /* EXPANDED FULL SIDEBAR (Matching Animal Crossing Sherwood) */
          /* --------------------------------------------------------- */
          <aside className="self-start w-full md:w-64 lg:w-72 shrink-0 bg-[#244E36] rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-[#1B3F2B] text-[#E0EEDF] flex flex-col transition-all duration-300 relative md:sticky md:top-6 gap-4">
            {/* Top Bar with Center Leaf & Collapse Toggle Button */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xl drop-shadow-xs">🍃</span>
                <button
                  onClick={toggleSidebar}
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                  className="w-7 h-7 rounded-full bg-[#1B3F2B] hover:bg-[#2F6144] text-[#E0EEDF] flex items-center justify-center border border-[#306346] shadow-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-[#E0EEDF]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
                    <path d="M9 3.5v17" />
                    <path d="M14.5 9.5l-3 2.5 3 2.5" />
                  </svg>
                </button>
              </div>

              {/* Wooden Sign Header Plaque (Matching Sherwood Island Plaque) */}
              <div className="relative group mb-3">
                <Link
                  href="/dashboard"
                  className="block relative bg-gradient-to-b from-[#8C5E35] via-[#7B4E28] to-[#5F3819] text-[#FFF6E5] py-4 px-3 rounded-2xl shadow-md border-3 border-[#4A260F] text-center transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                >
                  {/* Wood texture details */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px]" />
                  
                  {/* 4 Corner Screws */}
                  <div className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#301607] opacity-80" />
                  <div className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#301607] opacity-80" />
                  <div className="absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#301607] opacity-80" />
                  <div className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#301607] opacity-80" />

                  <div className="relative z-10">
                    <span className="text-[11px] font-bold text-[#F3D7A5] tracking-wide block mb-0.5">
                      Welcome to
                    </span>
                    <h2 className="text-2xl font-black tracking-wide text-white drop-shadow-md">
                      JuanDer
                    </h2>
                    <span className="text-xs font-bold text-[#F3D7A5] tracking-wider block mt-0.5">
                      Island Hub 🧭
                    </span>
                  </div>
                </Link>
              </div>

              {/* Navigation Items (Directly on dark green, active item is a full rounded white capsule pill) */}
              <nav className="space-y-1 mb-4">
                {SIDEBAR_NAV_ITEMS.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-full font-bold text-xs transition-all duration-150 ${
                      item.active
                        ? 'bg-[#FAF7F0] text-[#1F452C] shadow-md scale-[1.01]'
                        : 'text-[#DCE8DC] hover:bg-[#2C5E42] hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="tracking-wide text-[13px]">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mascot + Dagens Tips Card (Tom Nook Position from user image) */}
            <div className="relative mt-auto pt-2 flex flex-col items-center">
              {/* Friendly Mascot Avatar standing right above tip box */}
              <div className="relative z-10 -mb-4 cursor-pointer group" onClick={handleNextTip}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#FAF7F0] shadow-md bg-[#FAF7F0] transform transition-transform group-hover:scale-105 active:scale-95">
                  <Image
                    src="/cozy/juander_mascot.jpg"
                    alt="Juander Scout Mascot"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-[#1F3D2B] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-xs">
                  JUANDER
                </span>
              </div>

              {/* Eco Tips Speech Bubble (Matching user image Dagens tips) */}
              <div className="w-full bg-[#1B3F2B] rounded-2xl p-3.5 pt-5 border border-[#2B5E40] text-center relative shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    🍃 Daily Tip
                  </span>
                  <button
                    onClick={handleNextTip}
                    className="text-[10px] font-bold text-amber-300 hover:text-white hover:underline cursor-pointer"
                  >
                    Next 🍃
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-100/90 font-medium italic">
                  &ldquo;{ECO_TIPS[selectedTipIndex]}&rdquo;
                </p>
                <div className="flex justify-center mt-2 opacity-60">
                  <span className="text-xs">🍃</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* =========================================================== */}
        {/* MAIN COZY CONTENT DASHBOARD (Image 1 & Image 2) */}
        {/* =========================================================== */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          {/* --------------------------------------------------------- */}
          {/* 1. TOP PANORAMA BANNER (With HUD elements inside & unclipped dropdown) */}
          {/* --------------------------------------------------------- */}
          <div className="relative rounded-3xl min-h-[210px] sm:min-h-[230px] flex items-end z-20">
            {/* INNER IMAGE BOX (Takes care of rounded corners and image clipping) */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-[#DFD7C7] shadow-sm bg-[#EFE8D8] pointer-events-none">
              <Image
                src="/cozy/island_cozy_banner.jpg"
                alt="Pangasinan Island Camp Banner"
                fill
                priority
                className="object-cover object-center"
              />
              {/* Soft gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
            </div>

            {/* TOP BAR INSIDE THE BANNER: Date/Season/Time on Left, Search/Notif/Profile on Right */}
            <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
              {/* Left: Date, Season & Time Pill (Aligned horizontally with Profile) */}
              <div className="pointer-events-auto inline-flex items-center gap-2 bg-[#FAF7F0]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D5CCBC] shadow-xs text-xs font-bold text-[#2A3F30]">
                <div className="flex items-center gap-1.5 text-[#245C36]">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#5B8E67]" />
                  <span>15 Oct 2026</span>
                </div>
                <span className="text-[#C4B9A7] font-normal">•</span>
                <span className="text-[#3F5A46]">🍃 Amihan Season</span>
                <span className="text-[#C4B9A7] font-normal">•</span>
                <span className="text-[#8C5E35]">⏰ {currentTime}</span>
              </div>

              {/* Right: Search, Notification, and Profile */}
              <div className="pointer-events-auto flex items-center justify-end gap-2 sm:gap-2.5">
                {/* 1. Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="relative hidden sm:block"
                >
                  <div className="flex items-center bg-[#FAF7F0]/95 backdrop-blur-md border border-[#D5CCBC] rounded-full px-3.5 py-1.5 shadow-xs hover:border-[#5B8E67] focus-within:border-[#244E36] focus-within:ring-2 focus-within:ring-[#5B8E67]/20 transition-all">
                    <Search className="w-3.5 h-3.5 text-[#7A6046] mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search islands, quests, spots..."
                      className="bg-transparent text-xs text-[#2D3A2F] placeholder:text-[#8E9B90] focus:outline-none w-36 md:w-52 font-semibold"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[#7A6046] hover:text-[#2D3A2F] text-xs font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </form>

                {/* 2. Notifications Bell with Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((prev) => !prev)}
                    title="Expedition Notifications"
                    aria-label="Expedition Notifications"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF7F0]/95 backdrop-blur-md border border-[#D5CCBC] text-[#8C5E35] hover:text-[#244E36] flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer relative"
                  >
                    <Bell className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white" />
                  </button>

                  {/* Notifications Popover Dropdown (Unclipped! Floats cleanly over banner and below sections) */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-12 w-72 sm:w-80 bg-[#FAF7F0] border-2 border-[#D5CCBC] rounded-2xl shadow-2xl p-3.5 z-50 text-[#2D3A2F] animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E3DCce]">
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#1F452C]">
                          <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span>Island Activity</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          3 new
                        </span>
                      </div>

                      <div className="divide-y divide-[#EFEAE0] my-1 text-xs">
                        <div className="py-2">
                          <p className="font-bold text-[#1F452C] leading-tight">Hundred Islands Hopping</p>
                          <p className="text-[11px] text-[#55695A] mt-0.5">Pre-registered expedition starts tomorrow at 8:00 AM.</p>
                          <span className="text-[9px] text-[#8C5E35] font-semibold mt-1 block">10m ago</span>
                        </div>
                        <div className="py-2">
                          <p className="font-bold text-[#1F452C] leading-tight">Mangrove Planting XP</p>
                          <p className="text-[11px] text-[#55695A] mt-0.5">You earned +10 XP for planting native mangroves in Bani.</p>
                          <span className="text-[9px] text-[#8C5E35] font-semibold mt-1 block">1h ago</span>
                        </div>
                        <div className="py-2">
                          <p className="font-bold text-[#1F452C] leading-tight">Amihan Season Active</p>
                          <p className="text-[11px] text-[#55695A] mt-0.5">Local boat operators offering 15% off island hopping passes.</p>
                          <span className="text-[9px] text-[#8C5E35] font-semibold mt-1 block">3h ago</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E3DCce] flex items-center justify-between text-[11px]">
                        <Link
                          href="/quests"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="font-bold text-[#245C36] hover:underline"
                        >
                          View all quests →
                        </Link>
                        <button
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-[#8C5E35] hover:text-[#1F452C] font-semibold cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Explorer Profile Pill */}
                <Link
                  href="/profile"
                  title={user?.name || 'Explorer Juan'}
                  className="flex items-center gap-2 bg-[#FAF7F0]/95 backdrop-blur-md border border-[#D5CCBC] rounded-full p-1 sm:pr-3.5 shadow-xs hover:border-[#5B8E67] hover:scale-102 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#244E36] border border-[#306346] text-[#E0EEDF] flex items-center justify-center font-bold text-xs shadow-2xs">
                    {user?.name?.[0]?.toUpperCase() || 'J'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-[#1F452C] truncate max-w-[120px]">
                      {user?.name || 'Explorer Juan'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 mt-0.5">
                      ⭐ {totalPoints.toLocaleString()} XP
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Banner Content (Bottom): Welcome back, Juander! */}
            <div className="relative z-10 p-5 sm:p-6 text-white max-w-2xl pointer-events-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl sm:text-2xl">🍃</span>
                <h2 className="text-xl sm:text-3xl font-black drop-shadow-md tracking-tight">
                  Welcome back, Juander!
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 drop-shadow-sm font-medium">
                Here is your live expedition overview of Pangasinan Island • JuanDer Without Limits 🌲
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. EXPEDITION CENTER: EXPANDED 2/3 CALENDAR + 1/3 LIVE GPS */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* ------------------------------------------------------- */}
            {/* 2A. EXPANDED CALENDAR & EVENT SPOTLIGHT (2/3 Column)    */}
            {/* ------------------------------------------------------- */}
            <div className="lg:col-span-2 bg-[#FAF7F0] rounded-3xl p-5 sm:p-6 border-2 border-[#E3DCce] shadow-sm flex flex-col justify-between h-full">
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Header with Title and Month selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#1F452C] flex items-center gap-2">
                        <span>🍃</span> Expedition Calendar &amp; Island Events
                      </h3>
                      <p className="text-xs text-[#5D6B5F] mt-0.5">
                        Select a date to preview scheduled expeditions, local festivals, and joined traveler parties.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E5EFE7] text-[#245C36] border border-[#CDE1CE] shadow-2xs">
                        October 2026
                      </span>
                    </div>
                  </div>

                  {/* Expanded Calendar (Authentic Wall Calendar Layout — No calculator buttons) */}
                  <div className="bg-[#FAF7F0] rounded-2xl p-3.5 sm:p-5 border-2 border-[#E3DCce] shadow-xs">
                    {/* Calendar Days Header: Sunday is the first day */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-2 pb-1.5 border-b border-[#E3DCce]/70">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <span
                          key={i}
                          className={`py-0.5 text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                            i === 0 ? 'text-rose-600' : 'text-[#55695A]'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Calendar Days (Sun Sep 27 to Sat Oct 31 = exactly 5 clean rows of 7) */}
                    <div className="grid grid-cols-7 gap-y-1 sm:gap-y-1.5 gap-x-0.5 sm:gap-x-1 text-center">
                      {/* Previous Month padding days: Sep 27 (Sun), 28 (Mon), 29 (Tue), 30 (Wed) */}
                      {[27, 28, 29, 30].map((padDay, i) => (
                        <div key={`pad-${padDay}`} className="h-8 sm:h-9 flex items-center justify-center">
                          <span
                            className={`text-xs font-semibold select-none ${
                              i === 0 ? 'text-rose-400/40' : 'text-[#8C9B8F]/35'
                            }`}
                          >
                            {padDay}
                          </span>
                        </div>
                      ))}

                      {/* October 1 to 31 */}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const hasEvent = REGISTERED_EVENTS.some((e) => e.day === day);
                        const isSelected = selectedCalendarDay === day;
                        const isToday = day === 15;
                        const isSunday = (day + 4) % 7 === 1;

                        return (
                          <div key={day} className="h-8 sm:h-9 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setSelectedCalendarDay(day)}
                              className={`relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-[#245C36] text-white font-black shadow-md scale-105 z-10'
                                  : isToday
                                  ? 'ring-2 ring-[#245C36] ring-offset-2 ring-offset-[#FAF7F0] bg-emerald-100/70 text-[#1F452C] font-black'
                                  : isSunday
                                  ? 'text-rose-600 font-extrabold hover:bg-rose-50'
                                  : 'text-[#2D3A2F] hover:bg-[#EAE4D7] font-bold'
                              }`}
                            >
                              <span className="text-xs sm:text-sm leading-none">{day}</span>

                              {/* Event Dot on Upper Right Side of the circle */}
                              {hasEvent && (
                                <span
                                  className={`absolute top-0 right-0 w-2 h-2 rounded-full shadow-2xs ${
                                    isSelected ? 'bg-amber-300 ring-1 ring-[#245C36]' : 'bg-amber-500 ring-1 ring-white'
                                  }`}
                                  title="Scheduled Expedition/Quest"
                                />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Calendar Legend */}
                    <div className="mt-3 pt-2 border-t border-[#E3DCce] flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[#55695A] font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white shadow-2xs" />
                        <span>Expedition Event</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#245C36] ring-offset-1 bg-emerald-100 flex items-center justify-center text-[8px] font-black text-[#245C36]">15</span>
                        <span>Today</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#245C36] flex items-center justify-center text-[8px] font-black text-white">{selectedCalendarDay}</span>
                        <span>Selected Day</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Spotlight Cards or Empty State (Aligned bottom rectangle) */}
                {selectedDayEvents.length > 0 ? (
                  <div className="mt-4 max-h-[175px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-[#D5CCBC] scrollbar-track-transparent">
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-[#FAF1DF] rounded-2xl p-4 sm:p-4.5 border-2 border-[#E8DCC2] text-xs transition-all animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {event.location}
                              </span>
                              <span className="text-[11px] text-[#8C5E35] font-bold">
                                ⏰ {event.time} · {event.month} {event.day}, {event.year}
                              </span>
                            </div>

                            <h4 className="font-black text-sm sm:text-base text-[#233826] mt-0.5 leading-snug">
                              {event.title}
                            </h4>
                            <p className="text-xs text-[#55695A] mt-0.5 leading-relaxed line-clamp-2">
                              {event.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                            <span className="text-emerald-800 bg-emerald-100 font-black px-3 py-1 rounded-full border border-emerald-300 shadow-2xs text-[11px]">
                              ✓ Pre-Registered
                            </span>
                            <span className="text-[11px] font-extrabold text-[#8C5E35]">
                              👥 {event.participants} / {event.maxParticipants} Explorers
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 bg-[#FAF1DF]/50 rounded-2xl p-5 border-2 border-dashed border-[#E8DCC2] text-xs flex items-center justify-center min-h-[110px] text-center animate-in fade-in duration-150">
                    <div className="flex flex-col items-center gap-1.5 text-[#8C7A68]">
                      <span className="text-2xl">🍃</span>
                      <p className="font-bold text-sm text-[#233826]">No events/quests on this day.</p>
                      <p className="text-[11px] text-[#7A6B56]">
                        Select a date with an orange dot (e.g., Oct 18, 20, or 26) to preview scheduled expeditions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* 2B. LIVE RADAR & GPS MINI MAP (1/3 Column)             */}
            {/* ------------------------------------------------------- */}
            <div className="lg:col-span-1 bg-[#FAF7F0] rounded-3xl p-5 sm:p-6 border-2 border-[#E3DCce] shadow-sm flex flex-col justify-between h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-base font-extrabold text-[#1F452C] flex items-center gap-2">
                  <span>🧭</span> Island GPS Radar
                </h3>
                <Link
                  href="/map"
                  className="text-xs font-bold text-[#245C36] hover:underline flex items-center gap-1"
                >
                  Full Map <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Leaflet GPS Radar Mini Map Preview (Flexes to fill matching height with calendar) */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#DFD7C7] shadow-inner bg-[#EFE8D8] w-full flex-1 min-h-[260px] my-1 flex flex-col">
                <MiniMapPreview
                  lat={16.0315}
                  lng={120.2312}
                  name="Lingayen Gulf Beachfront"
                  municipality="Lingayen"
                  zoom={13}
                  height="h-full w-full"
                  hideBadge={true}
                />
                {/* Live Status overlay badge */}
                <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-1.5 pointer-events-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>Live GPS Active</span>
                </div>
              </div>

              {/* Coordinates Pill */}
              <div className="mt-3.5 bg-[#EFEAE0] rounded-2xl p-3.5 border border-[#DFD7C7] text-xs shrink-0">
                <div className="flex items-center justify-between font-bold text-[#1F452C]">
                  <span>Coordinates:</span>
                  <span className="font-mono text-[#8C5E35]">16.0315° N, 120.2312° E</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. TABBED ISLAND ACTIVITY HUB (Badges, Voting, MSME Perks) */}
          {/* ========================================================= */}
          <div className="bg-[#FAF7F0] rounded-3xl p-5 sm:p-6 border-2 border-[#E3DCce] shadow-sm">
            {/* Header & Activity Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E3DCce]">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1F452C] flex items-center gap-2">
                  <span>🌿</span> Island Activity &amp; Explorer Hub
                </h3>
                <p className="text-xs text-[#5D6B5F] mt-0.5">
                  Track your explorer milestones, cast community votes, and claim MSME rewards.
                </p>
              </div>

              {/* Tabs Switcher (Parchment Wood RPG styling) */}
              <div className="flex items-center gap-1.5 bg-[#EFEAE0] p-1.5 rounded-2xl border border-[#DFD7C7] self-start sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setActiveActivityTab('badges')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeActivityTab === 'badges'
                      ? 'bg-[#245C36] text-white shadow-xs scale-102'
                      : 'text-[#55695A] hover:bg-[#E3DCce]'
                  }`}
                >
                  <span>🏅</span>
                  <span>Badges (8)</span>
                </button>
                <button
                  onClick={() => setActiveActivityTab('voting')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeActivityTab === 'voting'
                      ? 'bg-[#245C36] text-white shadow-xs scale-102'
                      : 'text-[#55695A] hover:bg-[#E3DCce]'
                  }`}
                >
                  <span>🗳️</span>
                  <span>Juan Choice</span>
                </button>
                <button
                  onClick={() => setActiveActivityTab('perks')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeActivityTab === 'perks'
                      ? 'bg-[#245C36] text-white shadow-xs scale-102'
                      : 'text-[#55695A] hover:bg-[#E3DCce]'
                  }`}
                >
                  <span>🏪</span>
                  <span>MSME Perks (3)</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: BADGES */}
            {activeActivityTab === 'badges' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[#5D6B5F]">
                    Click any badge to inspect its rarity, folklore story, and unlock requirements.
                  </p>
                  <Link
                    href="/profile"
                    className="text-xs font-extrabold text-[#245C36] hover:underline flex items-center gap-1 shrink-0"
                  >
                    View All in Profile <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 text-center">
                  {SAMPLE_USER_BADGES.slice(0, 8).map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 bg-[#EFEAE0]/60 hover:bg-[#EFEAE0] p-3 rounded-2xl border border-[#DFD7C7]"
                    >
                      <div className="w-13 h-13 rounded-full bg-[#FAF7F0] border-2 border-[#DFD7C7] flex items-center justify-center text-2xl shadow-xs group-hover:border-[#245C36] group-hover:bg-[#E2EFE4] transition-all mb-1.5">
                        {badge.icon || '🏅'}
                      </div>
                      <span className="text-xs font-bold text-[#2A3F30] truncate w-full group-hover:text-[#245C36]">
                        {badge.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-[#8C5E35] font-semibold mt-0.5">
                        {badge.tier || 'Gold'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: JUAN CHOICE VOTING */}
            {activeActivityTab === 'voting' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="bg-gradient-to-r from-[#8C5E35] to-[#6E4220] rounded-2xl py-2 px-4 text-white shadow-xs inline-flex items-center gap-2">
                    <span className="text-sm">🌅</span>
                    <span className="text-xs font-black">
                      Active Theme: Best Sunset &amp; Coastal Trails in Pangasinan
                    </span>
                  </div>

                  <Link
                    href="/community-choice"
                    className="text-xs font-bold text-[#245C36] hover:underline flex items-center gap-1"
                  >
                    Leaderboard &amp; Voting <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      rank: '🥇',
                      name: 'Patar White Beach',
                      municipality: 'Bolinao',
                      votes: 942,
                      highlight: 'Pristine coral sands & sunset lighthouse',
                      href: '/spots',
                    },
                    {
                      rank: '🥈',
                      name: "Governor's Island Peak",
                      municipality: 'Alaminos',
                      votes: 815,
                      highlight: '360° Hundred Islands viewpoint',
                      href: '/spots',
                    },
                    {
                      rank: '🥉',
                      name: 'Bonuan Tondaligan Beach',
                      municipality: 'Dagupan',
                      votes: 670,
                      highlight: 'Famous seafood & bangus grill walk',
                      href: '/spots',
                    },
                  ].map((spot, i) => (
                    <Link
                      key={i}
                      href={spot.href}
                      className="bg-[#EFEAE0] hover:bg-[#E5DFD3] rounded-2xl p-4 border border-[#DFD7C7] flex items-center justify-between transition-all hover:scale-102 group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{spot.rank}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1F452C] group-hover:text-[#245C36] truncate">
                            {spot.name}
                          </p>
                          <p className="text-[11px] text-[#8C5E35] font-semibold">
                            {spot.municipality}
                          </p>
                          <p className="text-[10px] text-[#5D6B5F] mt-1 line-clamp-1">
                            {spot.highlight}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right pl-3">
                        <span className="text-sm font-black text-[#8C5E35] block">{spot.votes}</span>
                        <span className="text-[9px] font-bold text-[#7A8B7E] uppercase">votes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: LOCAL MSME PERKS & VOUCHERS */}
            {activeActivityTab === 'perks' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[#5D6B5F]">
                    Redeem your Explorer XP with verified Pangasinan MSMEs for authentic dining, tours, and artisan goods.
                  </p>
                  <Link
                    href="/shop"
                    className="text-xs font-bold text-[#245C36] hover:underline flex items-center gap-1 shrink-0"
                  >
                    Browse Full Voucher Shop <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Voucher 1: Bangus Grill */}
                  <div className="bg-[#FAF1DF] rounded-2xl p-4 border border-[#E8DCC2] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          Culinary Partner
                        </span>
                        <span className="text-lg">🐟</span>
                      </div>
                      <h4 className="text-sm font-black text-[#582F0E]">
                        Dagupeña Bangus Grill &amp; Cafe
                      </h4>
                      <p className="text-[11px] text-[#69481E] mt-1 font-semibold">
                        15% OFF Grilled Boneless Bangus &amp; Seafood Platters
                      </p>
                      <p className="text-[10px] text-[#7A6B56] mt-1 leading-relaxed">
                        Valid on dining along Bonuan Tondaligan Beach Promenade.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E8DCC2] flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#8C5E35]">150 XP</span>
                      <button
                        onClick={() => handleClaimPerk('BANGUS-PERK-15', 'Dagupeña Bangus Grill')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#8C5E35] hover:bg-[#6E4220] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        {claimedPerks.includes('BANGUS-PERK-15') ? '✓ Claimed' : 'Claim Voucher'}
                      </button>
                    </div>
                  </div>

                  {/* Voucher 2: Lucap Wharf Eco-Kayak */}
                  <div className="bg-[#EFEAE0] rounded-2xl p-4 border border-[#DFD7C7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Eco-Tour Partner
                        </span>
                        <span className="text-lg">🛶</span>
                      </div>
                      <h4 className="text-sm font-black text-[#1F452C]">
                        Lucap Wharf Eco-Kayak &amp; Island Rentals
                      </h4>
                      <p className="text-[11px] text-[#245C36] mt-1 font-semibold">
                        Free Snorkeling Gear Rental with Island Hopping Pass
                      </p>
                      <p className="text-[10px] text-[#5D6B5F] mt-1 leading-relaxed">
                        Valid at Lucap Wharf Alaminos Tourist Information Center.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DFD7C7] flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#8C5E35]">200 XP</span>
                      <button
                        onClick={() => handleClaimPerk('LUCAP-SNORKEL-FREE', 'Lucap Wharf Eco-Kayak')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#245C36] hover:bg-[#1B4332] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        {claimedPerks.includes('LUCAP-SNORKEL-FREE') ? '✓ Claimed' : 'Claim Voucher'}
                      </button>
                    </div>
                  </div>

                  {/* Voucher 3: Bolinao Handwoven Buri Crafts */}
                  <div className="bg-[#EFEAE0] rounded-2xl p-4 border border-[#DFD7C7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Artisan Partner
                        </span>
                        <span className="text-lg">🧺</span>
                      </div>
                      <h4 className="text-sm font-black text-[#1F452C]">
                        Bolinao Buri Weavers &amp; Salt Artisans
                      </h4>
                      <p className="text-[11px] text-[#245C36] mt-1 font-semibold">
                        ₱100 Discount on Handcrafted Buri Mats &amp; Sea Salt
                      </p>
                      <p className="text-[10px] text-[#5D6B5F] mt-1 leading-relaxed">
                        Directly supports women artisans and traditional Dasol salt pans.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DFD7C7] flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#8C5E35]">100 XP</span>
                      <button
                        onClick={() => handleClaimPerk('BOLINAO-BURI-100', 'Bolinao Buri Weavers')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#245C36] hover:bg-[#1B4332] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        {claimedPerks.includes('BOLINAO-BURI-100') ? '✓ Claimed' : 'Claim Voucher'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BADGE PREVIEW MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF7F0] rounded-3xl max-w-sm w-full p-6 border-4 border-[#DFD7C7] shadow-2xl relative text-center">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#EFEAE0] hover:bg-[#DFD7C7] text-[#55695A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-full bg-[#EFEAE0] border-4 border-[#245C36] flex items-center justify-center text-4xl mx-auto shadow-md mb-4">
              {selectedBadge.icon || '🏅'}
            </div>

            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {selectedBadge.rarity.toUpperCase()} BADGE
            </span>

            <h4 className="text-lg font-black text-[#1F452C] mt-2">
              {selectedBadge.name}
            </h4>

            <p className="text-xs text-[#5D6B5F] mt-2 leading-relaxed">
              {selectedBadge.description}
            </p>

            {selectedBadge.howToEarn && (
              <div className="mt-4 p-3 rounded-2xl bg-[#EFEAE0] text-left text-xs border border-[#DFD7C7]">
                <span className="font-bold text-[#1F452C] block mb-0.5">How to Earn:</span>
                <p className="text-[#5D6B5F] text-[11px] leading-relaxed">
                  {selectedBadge.howToEarn}
                </p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setSelectedBadge(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#245C36] hover:bg-[#1B4332] text-white font-extrabold text-xs shadow-xs transition-colors"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* FLOATING BOUNCING QUEST ICON (Keeps bouncing on hover)        */}
      {/* ============================================================= */}
      <div className="fixed bottom-6 right-6 z-40 animate-bounce pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsQuestModalOpen(true)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FAF7F0] via-[#F4EFE6] to-[#EFE8D8] border-3 border-[#245C36] shadow-2xl flex items-center justify-center text-2xl sm:text-3xl hover:border-amber-500 hover:shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer group focus:outline-none"
          title="Active Quests Journal"
          aria-label="Active Quests Journal"
        >
          <span className="select-none transform group-hover:rotate-6 transition-transform">📜</span>

          {/* Red indicator dot on the upper right side */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 ring-2 ring-white border border-red-600 shadow-xs" />
          </span>
        </button>
      </div>

      {/* QUEST JOURNAL POP-UP MODAL */}
      <QuestJournalModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        treesPlanted={treesPlanted}
      />

      {/* VOUCHER CLAIM TOAST */}
      {voucherToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#1F452C] text-white p-4 rounded-2xl shadow-xl border-2 border-emerald-400/40 flex items-center gap-3.5 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center text-xl shrink-0">
            🎟️
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
              Voucher Unlocked!
            </span>
            <p className="text-xs font-bold">{voucherToast.title}</p>
            <p className="text-[11px] font-mono text-emerald-200 mt-0.5">
              Code: <span className="font-black text-amber-300 select-all">{voucherToast.code}</span>
            </p>
          </div>
          <button
            onClick={() => setVoucherToast(null)}
            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
