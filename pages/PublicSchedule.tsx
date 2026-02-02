import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from '../components/Calendar';
import { FixedShift, OneOffBooking, Therapist } from '../types';
import { getInitialFixedShifts, getInitialOneOffs, getNextSunday } from '../services/mockDb';
import { db, isCloudEnabled, subscribeToChanges } from '../services/supabase';
import {
  ChevronRight, ChevronLeft, LayoutGrid, LayoutList,
  CalendarClock, RefreshCw, Share2, Check, ExternalLink, Columns, Filter
} from 'lucide-react';
import { ROOMS, INITIAL_THERAPISTS, WEEK_DAYS_HE } from '../constants';
import { Link } from 'react-router-dom';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  return result;
};

const formatDisplayDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatMonthYear = (date: Date): string => {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const PublicSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(getNextSunday()));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('all');

  const [fixedShifts, setFixedShifts] = useState<FixedShift[]>(() => {
    const saved = localStorage.getItem('clinic_fixed_shifts');
    return saved ? JSON.parse(saved) : getInitialFixedShifts();
  });

  const [oneOffBookings, setOneOffBookings] = useState<OneOffBooking[]>(() => {
    const saved = localStorage.getItem('clinic_one_off_bookings');
    return saved ? JSON.parse(saved) : getInitialOneOffs();
  });

  const [therapists, setTherapists] = useState<Therapist[]>(() => {
    const saved = localStorage.getItem('clinic_therapists');
    return saved ? JSON.parse(saved) : INITIAL_THERAPISTS;
  });

  const loadData = async (silent = false) => {
    if (!isCloudEnabled()) return;

    if (!silent) setIsLoading(true);
    try {
      const cloudTherapists = await db.getTherapists();
      if (cloudTherapists.length > 0) setTherapists(cloudTherapists);

      const cloudFixed = await db.getFixedShifts();
      const cloudOneOffs = await db.getOneOffBookings();

      setFixedShifts(cloudFixed);
      setOneOffBookings(cloudOneOffs);
    } catch (e: any) {
      console.error("Cloud load failed:", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCloudEnabled()) {
      loadData();
      const unsubscribe = subscribeToChanges(() => loadData(true));
      return () => unsubscribe();
    }
  }, []);

  const next = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getWeekRange = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;
  };

  const visibleRooms = selectedRoomId === 'all' ? ROOMS : ROOMS.filter(r => r.id === selectedRoomId);
  const visibleFixedShifts = selectedTherapistId === 'all' ? fixedShifts : fixedShifts.filter(fs => fs.therapistId === selectedTherapistId);
  const visibleOneOffs = selectedTherapistId === 'all' ? oneOffBookings : oneOffBookings.filter(ob => ob.therapistId === selectedTherapistId);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-900 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight flex items-center gap-3">
              לוח משמרות
              {isLoading && <RefreshCw className="animate-spin text-indigo-300" size={20} />}
            </h1>
            <p className="text-gray-500 mt-1">צפייה בלוח המשמרות של הקליניקה</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg order-2 md:order-1">
            <button onClick={() => setViewMode('day')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutList size={16} /> <span className="hidden sm:inline">יומי</span>
            </button>
            <button onClick={() => setViewMode('week')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Columns size={16} /> <span className="hidden sm:inline">שבועי</span>
            </button>
            <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutGrid size={16} /> <span className="hidden sm:inline">חודשי</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto order-1 md:order-2">
            <button onClick={goToToday} className="bg-white text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 text-indigo-600 transition-colors flex items-center gap-2">
              <CalendarClock size={16} /> <span className="hidden sm:inline">היום</span>
            </button>
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto justify-between md:justify-center flex-1">
              <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg text-indigo-600 transition"><ChevronRight size={20} strokeWidth={2.5} /></button>
              <div className="text-center min-w-[140px] md:min-w-[200px]">
                {viewMode === 'day' ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-black text-gray-800 leading-none">{WEEK_DAYS_HE[currentDate.getDay()]}</span>
                    <span className="text-xs md:text-sm text-gray-500 font-medium">{formatDisplayDate(currentDate)}</span>
                  </div>
                ) : viewMode === 'week' ? (
                  <div className="flex flex-col items-center">
                    <span className="text-lg md:text-xl font-black text-gray-800 leading-none">שבוע</span>
                    <span className="text-xs md:text-sm text-gray-500 font-medium">{getWeekRange(currentDate)}</span>
                  </div>
                ) : <span className="text-xl md:text-2xl font-black text-gray-800">{formatMonthYear(currentDate)}</span>}
              </div>
              <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg text-indigo-600 transition"><ChevronLeft size={20} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto justify-end flex-wrap">
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border shadow-sm ${
              copied
                ? 'bg-green-600 border-green-700 text-white'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'הועתק!' : 'שתף לינק'}
          </button>
          <Link
            to="/"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <ExternalLink size={18} /> ניהול מלא
          </Link>
        </div>
      </header>

      <main className="space-y-6">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-500 font-medium text-sm pl-2">
            <Filter size={18} /> <span>סינון:</span>
          </div>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full md:w-auto p-2"
          >
            <option value="all">כל החדרים</option>
            {ROOMS.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
          <select
            value={selectedTherapistId}
            onChange={(e) => setSelectedTherapistId(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full md:w-auto p-2"
          >
            <option value="all">כל המטפלים</option>
            {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="h-[650px]">
          <Calendar
            currentDate={currentDate}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onDateSelect={setCurrentDate}
            fixedShifts={visibleFixedShifts}
            oneOffBookings={visibleOneOffs}
            rooms={visibleRooms}
            therapists={therapists}
            onSlotClick={() => {}}
          />
        </div>
      </main>

      <footer className="mt-8 text-center text-gray-400 text-sm">
        <p>לוח משמרות זה מתעדכן בזמן אמת</p>
      </footer>
    </div>
  );
};

export default PublicSchedule;
