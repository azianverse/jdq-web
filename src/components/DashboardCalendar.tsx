'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Tag,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  Filter,
  Flame,
  Award,
  Vote,
  Compass,
} from 'lucide-react';
import { appRoutes } from '@/lib/routes';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD for multi-day
  municipality: string;
  category: 'festival' | 'eco_quest' | 'dao_voting' | 'cultural' | 'market';
  description: string;
  badge?: string;
  highlight?: boolean;
  spotId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

// Authentic Pangasinan provincial festival, tourism, and community governance calendar
export const PANGASINAN_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-bangus-fest-2026',
    title: 'Dagupan Bangus Festival & Gilon-Gilon',
    date: '2026-10-18',
    endDate: '2026-10-24',
    municipality: 'Dagupan City',
    category: 'festival',
    description: 'Annual world-famous celebration honoring the milkfish capital of the world with street dancing and grilling promenades.',
    badge: 'Provincial Major Festival',
    highlight: true,
    spotId: 'spot-bonuan-blue-beach',
    actionUrl: '/spots/spot-bonuan-blue-beach',
    actionLabel: 'View Dagupan Hub',
  },
  {
    id: 'ev-pista-dayat-2026',
    title: 'Pista’y Dayat (Sea & Coastal Festival)',
    date: '2026-10-26',
    endDate: '2026-10-28',
    municipality: 'Lingayen & Coastal LGUs',
    category: 'festival',
    description: 'Thanksgiving coastal festival along Lingayen Gulf featuring sand-sculpting competitions, coastal walks, and regatta races.',
    badge: 'Coastal Celebration',
    highlight: true,
    spotId: 'spot-lingayen-baywalk',
    actionUrl: '/spots/spot-lingayen-baywalk',
    actionLabel: 'Explore Lingayen Baywalk',
  },
  {
    id: 'ev-hundred-islands-cleanup',
    title: 'Hundred Islands Marine Sanctuary Eco-Quest',
    date: '2026-10-14',
    municipality: 'Alaminos City',
    category: 'eco_quest',
    description: 'Weekly low-tide marine park reef monitoring and Lucap gateway verification for travelers.',
    badge: '+100 XP Quest',
    spotId: 'spot-hundred-islands',
    actionUrl: '/quests/quest-hundred-islands',
    actionLabel: 'Play Eco-Quest',
  },
  {
    id: 'ev-juanchoice-round-2',
    title: 'JuanChoice Community Spotlight: Round 2',
    date: '2026-10-20',
    endDate: '2026-10-25',
    municipality: 'Pangasinan-Wide (48 LGUs)',
    category: 'dao_voting',
    description: 'Vote for emerging hidden gems to receive spotlight allocation and provincial tourism promotion. Advances Round Streak.',
    badge: 'Civic Round Streak',
    highlight: true,
    actionUrl: '/choice',
    actionLabel: 'Enter JuanChoice',
  },
  {
    id: 'ev-puto-calasiao-weekend',
    title: 'Calasiao Puto & Culinary Weekend Expo',
    date: '2026-10-17',
    municipality: 'Calasiao',
    category: 'market',
    description: 'Showcase of authentic bite-sized rice delicacies and regional northern Luzon trade stalls.',
    badge: 'Food & Heritage',
    spotId: 'spot-calasiao-puto-village',
    actionUrl: '/spots/spot-calasiao-puto-village',
    actionLabel: 'View Puto Stalls',
  },
  {
    id: 'ev-patar-sunset-ar',
    title: 'Cape Bolinao Coastal AR Viewfinder Trails',
    date: '2026-10-15',
    municipality: 'Bolinao',
    category: 'eco_quest',
    description: 'Guided azimuth navigation and 3D parametric gem capture at Patar White Beach & 1905 Cape Bolinao Lighthouse.',
    badge: 'AR Verification',
    spotId: 'spot-cape-bolinao-lighthouse',
    actionUrl: '/spots/spot-cape-bolinao-lighthouse',
    actionLabel: 'View Lighthouse Spot',
  },
  {
    id: 'ev-binalonan-plaza-walk',
    title: 'Holy Child Parish Heritage Walk & Nocturnal Tour',
    date: '2026-10-22',
    municipality: 'Binalonan',
    category: 'cultural',
    description: 'Architectural appreciation of the 1841 colonial parish and centennial acacia canopy promenades.',
    badge: 'Heritage Site',
    spotId: 'spot-binalonan-church',
    actionUrl: '/spots/spot-binalonan-church',
    actionLabel: 'View Heritage Church',
  },
  {
    id: 'ev-manaoag-dawn-mass',
    title: 'Manaoag Pilgrim Gathering & Blessing Trail',
    date: '2026-10-18',
    municipality: 'Manaoag',
    category: 'cultural',
    description: 'Early morning traditional blessing rites and historical museum viewing at Minor Basilica of Manaoag.',
    badge: 'Pilgrim Pathway',
    spotId: 'spot-manaoag',
    actionUrl: '/spots/spot-manaoag',
    actionLabel: 'Explore Basilica',
  },
  {
    id: 'ev-antong-falls-hike',
    title: 'Antong Falls Mountain Brook Trek & Cleanup',
    date: '2026-10-30',
    municipality: 'Sison',
    category: 'eco_quest',
    description: 'Highland trek along natural granite water pools near the Benguet boundary.',
    badge: 'Eco Trek',
    spotId: 'spot-antong-falls',
    actionUrl: '/spots/spot-antong-falls',
    actionLabel: 'View Antong Falls',
  },
  {
    id: 'ev-tayug-sunflower-harvest',
    title: 'Tayug Agri-Park Sunflower Maze Opening',
    date: '2026-10-28',
    municipality: 'Tayug',
    category: 'market',
    description: 'Seasonal blooming opening of eastern Pangasinan’s agri-tourism sunflower landscape.',
    badge: 'Agri-Tourism',
    spotId: 'spot-tayug-sunflower-maze',
    actionUrl: '/spots/spot-tayug-sunflower-maze',
    actionLabel: 'View Sunflower Maze',
  },
];

const CATEGORY_STYLES: Record<
  CalendarEvent['category'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  festival: {
    label: 'Festival',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  eco_quest: {
    label: 'Eco-Quest',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  dao_voting: {
    label: 'Governance Vote',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  cultural: {
    label: 'Cultural Heritage',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  market: {
    label: 'Food & Trade Expo',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
};

export function DashboardCalendar() {
  // Current view date (Default October 2026)
  const [viewDate, setViewDate] = useState(() => new Date(2026, 9, 13)); // Oct 13, 2026
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-18');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Month navigation
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const jumpToToday = () => {
    setViewDate(new Date(2026, 9, 13));
    setSelectedDate('2026-10-13');
  };

  // Days in month calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  // Filter events
  const filteredEvents = useMemo(() => {
    return PANGASINAN_EVENTS.filter((ev) => {
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedCategory]);

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      // Single day
      if (!ev.endDate || ev.endDate === ev.date) {
        if (!map[ev.date]) map[ev.date] = [];
        map[ev.date].push(ev);
      } else {
        // Span multi-days
        const start = new Date(ev.date);
        const end = new Date(ev.endDate);
        const cur = new Date(start);
        while (cur <= end) {
          const key = cur.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push(ev);
          cur.setDate(cur.getDate() + 1);
        }
      }
    });
    return map;
  }, [filteredEvents]);

  // Selected date events
  const activeEvents = useMemo(() => {
    return eventsByDate[selectedDate] || [];
  }, [eventsByDate, selectedDate]);

  return (
    <section className="bg-white rounded-3xl border border-[#E3DFD5] shadow-xs overflow-hidden">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-[#FFB703]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              Pangasinan Tourism &amp; Community Calendar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Expedition &amp; Festival Schedule
          </h2>
          <p className="text-xs text-emerald-100/90 max-w-xl">
            Live itinerary covering cultural festivals, active Eco-Quests, voting round deadlines, and weekend community markets.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap self-start md:self-center">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#FFB703] text-[#582F0E] shadow-2xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('festival')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'festival'
                ? 'bg-[#FFB703] text-[#582F0E] shadow-2xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Festivals
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('eco_quest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'eco_quest'
                ? 'bg-[#FFB703] text-[#582F0E] shadow-2xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Eco-Quests
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('dao_voting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'dao_voting'
                ? 'bg-[#FFB703] text-[#582F0E] shadow-2xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Voting
          </button>
        </div>
      </div>

      {/* Main Calendar Body: 2-Column (Calendar Matrix + Detailed Event Feed) */}
      <div className="p-5 sm:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7-Cols: Interactive Month Matrix */}
        <div className="lg:col-span-7 space-y-4">
          {/* Month Controller */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-[#2C221E]">
                {monthName} {year}
              </span>
              <button
                type="button"
                onClick={jumpToToday}
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[#582F0E] transition cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-[#837560] py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-12 sm:h-16 rounded-xl bg-stone-50/50" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const events = eventsByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === '2026-10-13';

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative h-12 sm:h-16 p-1.5 rounded-xl text-left border transition flex flex-col justify-between cursor-pointer select-none ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 shadow-xs'
                      : isToday
                      ? 'bg-amber-50/60 border-amber-300'
                      : events.length > 0
                      ? 'bg-white border-[#E3DFD5] hover:border-[#2D6A4F]/40'
                      : 'bg-white/80 border-[#F0ECE1] hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? 'text-[#2D6A4F] font-black'
                          : isToday
                          ? 'text-amber-800 font-black'
                          : 'text-[#2C221E]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Today" />
                    )}
                  </div>

                  {/* Event indicators dots/chips */}
                  {events.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                      {events.slice(0, 3).map((ev) => {
                        const style = CATEGORY_STYLES[ev.category];
                        return (
                          <span
                            key={ev.id}
                            className={`w-2 h-2 rounded-full ${style.dot} shrink-0`}
                            title={`${ev.title} (${style.label})`}
                          />
                        );
                      })}
                      {events.length > 3 && (
                        <span className="text-[9px] font-black text-[#837560] leading-none">
                          +{events.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Category Legend */}
          <div className="flex items-center gap-3 pt-2 text-[11px] text-[#837560] flex-wrap border-t border-[#F2EFE9]">
            <span className="font-bold text-[#582F0E]">Legend:</span>
            {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span>{style.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5-Cols: Selected Day Detail Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
            <div>
              <span className="text-[10px] font-black uppercase text-[#837560] block tracking-wider">
                Selected Schedule
              </span>
              <h3 className="text-base font-black text-[#2C221E]">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[#582F0E] text-[10px] font-black">
              {activeEvents.length} {activeEvents.length === 1 ? 'Activity' : 'Activities'}
            </span>
          </div>

          {activeEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#FAF9F5] border border-[#E3DFD5] space-y-2">
              <CalendarIcon className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-[#582F0E]">No scheduled activities for this date</p>
              <p className="text-[11px] text-[#837560]">
                Explore other dates on the calendar or jump into our open Pangasinan destinations.
              </p>
              <button
                type="button"
                onClick={() => setSelectedDate('2026-10-18')}
                className="mt-2 text-xs font-black text-[#2D6A4F] hover:underline cursor-pointer"
              >
                Check Dagupan Bangus Festival (Oct 18) ↗
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {activeEvents.map((ev) => {
                const style = CATEGORY_STYLES[ev.category];
                return (
                  <article
                    key={ev.id}
                    className={`p-4 rounded-2xl border ${style.border} ${style.bg} space-y-2.5 transition shadow-2xs hover:shadow-xs`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${style.text} bg-white/70 border ${style.border}`}
                        >
                          {ev.badge || style.label}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-[#2C221E] leading-snug">
                          {ev.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#837560] shrink-0">
                        <MapPin className="w-3 h-3 text-[#2D6A4F]" />
                        <span>{ev.municipality}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#514532] leading-relaxed">
                      {ev.description}
                    </p>

                    {ev.actionUrl && (
                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <span className="text-[10px] text-[#837560] font-mono">
                          {ev.endDate ? `${ev.date} to ${ev.endDate}` : ev.date}
                        </span>

                        <Link
                          href={ev.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-black text-[#2D6A4F] hover:underline"
                        >
                          <span>{ev.actionLabel || 'View Activity'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
