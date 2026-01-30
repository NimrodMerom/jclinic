
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar } from './components/Calendar';
import { BookingModal } from './components/BookingModal';
import { SchemaDocs } from './components/SchemaDocs';
import { Assistant } from './components/Assistant';
import { TherapistManager } from './components/TherapistManager';
import { PaymentsReport } from './components/PaymentsReport';
import { CloudSetup } from './components/CloudSetup';
import { FixedShift, OneOffBooking, Therapist } from './types';
import { getInitialFixedShifts, getInitialOneOffs, getNextSunday } from './services/mockDb';
import { db, isCloudEnabled, initSupabase, subscribeToChanges } from './services/supabase';
import {
  ChevronRight, ChevronLeft, Calendar as CalendarIcon, Info, Filter,
  Settings, LayoutGrid, LayoutList, Calculator, CalendarClock, Cloud, CloudOff, RefreshCw, AlertTriangle, WifiOff, Share2, Check, Columns
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROOMS, INITIAL_THERAPISTS, WEEK_DAYS_HE } from './constants';

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

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(getNextSunday()));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{roomId?: string, time?: string}>({});
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudActive, setCloudActive] = useState(isCloudEnabled());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState(false);
  
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('all');
  const [linkCopied, setLinkCopied] = useState(false);

  // שימוש ב-Ref כדי למנוע דריסה של הנתונים בזמן שאנחנו מבצעים פעולת כתיבה
  const syncLockRef = useRef<number>(0);
  const therapistsRef = useRef(therapists);

  useEffect(() => {
    therapistsRef.current = therapists;
    localStorage.setItem('clinic_therapists', JSON.stringify(therapists));
  }, [therapists]);

  useEffect(() => {
    localStorage.setItem('clinic_fixed_shifts', JSON.stringify(fixedShifts));
  }, [fixedShifts]);

  useEffect(() => {
    localStorage.setItem('clinic_one_off_bookings', JSON.stringify(oneOffBookings));
  }, [oneOffBookings]);

  const loadData = useCallback(async (silent = false) => {
    if (!isCloudEnabled()) return;
    
    // אם עשינו שינוי לא מזמן, אל תטען נתונים מהשרת כדי שלא נדרוס את מה שכתבנו
    if (silent && Date.now() - syncLockRef.current < 5000) {
      console.log("Sync skipped due to recent local change");
      return;
    }

    if (!silent) setIsLoading(true);
    try {
      const cloudTherapists = await db.getTherapists();
      if (cloudTherapists.length > 0) setTherapists(cloudTherapists);

      const cloudFixed = await db.getFixedShifts();
      const cloudOneOffs = await db.getOneOffBookings();
      
      setFixedShifts(cloudFixed);
      setOneOffBookings(cloudOneOffs);
      setSyncWarning(false);
    } catch (e: any) {
      console.error("Cloud load failed:", e);
      if (!silent) setErrorMsg("שגיאת טעינה: " + e.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCloudActive(isCloudEnabled());
    if (isCloudEnabled()) {
      loadData();
      const unsubscribe = subscribeToChanges(() => loadData(true));
      return () => unsubscribe();
    }
  }, [loadData]);

  const handleAddFixed = async (shift: FixedShift) => {
    syncLockRef.current = Date.now();
    setFixedShifts(prev => [...prev, shift]);
    
    if (isCloudEnabled()) {
      try { 
        const therapist = therapistsRef.current.find(t => t.id === shift.therapistId);
        if (therapist) await db.saveTherapist(therapist);
        await db.saveFixedShift(shift); 
      } catch (e: any) { 
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleAddOneOff = async (booking: OneOffBooking) => {
    syncLockRef.current = Date.now();
    setOneOffBookings(prev => [...prev, booking]);
    
    if (isCloudEnabled()) {
      try { 
        const therapist = therapistsRef.current.find(t => t.id === booking.therapistId);
        if (therapist) await db.saveTherapist(therapist);
        await db.saveOneOffBooking(booking); 
      } catch (e: any) { 
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleDeleteFixed = async (id: string) => {
    syncLockRef.current = Date.now();
    setFixedShifts(prev => prev.filter(s => s.id !== id));
    if (isCloudEnabled()) {
      try { await db.deleteFixedShift(id); } catch (e: any) {
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleDeleteOneOff = async (id: string) => {
    syncLockRef.current = Date.now();
    setOneOffBookings(prev => prev.filter(b => b.id !== id));
    if (isCloudEnabled()) {
      try { await db.deleteOneOffBooking(id); } catch (e: any) {
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleAddTherapist = async (therapist: Therapist) => {
    syncLockRef.current = Date.now();
    setTherapists(prev => {
      const exists = prev.find(t => t.id === therapist.id);
      if (exists) return prev.map(t => t.id === therapist.id ? therapist : t);
      return [...prev, therapist];
    });
    if (isCloudEnabled()) {
      try { await db.saveTherapist(therapist); } catch (e: any) {
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleDeleteTherapist = async (id: string) => {
    syncLockRef.current = Date.now();
    setTherapists(prev => prev.filter(t => t.id !== id));
    if (isCloudEnabled()) {
      try { await db.deleteTherapist(id); } catch (e: any) {
        setErrorMsg(e.message);
        setSyncWarning(true);
      }
    }
  };

  const handleSlotClick = (roomId?: string, time?: string) => {
    setModalInitialData({ roomId, time });
    setIsModalOpen(true);
  };

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

  const getWeekRange = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleShareSchedule = async () => {
    const scheduleUrl = `${window.location.origin}/schedule`;
    try {
      await navigator.clipboard.writeText(scheduleUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      const textArea = document.createElement('textarea');
      textArea.value = scheduleUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const visibleRooms = selectedRoomId === 'all' ? ROOMS : ROOMS.filter(r => r.id === selectedRoomId);
  const visibleFixedShifts = selectedTherapistId === 'all' ? fixedShifts : fixedShifts.filter(fs => fs.therapistId === selectedTherapistId);
  const visibleOneOffs = selectedTherapistId === 'all' ? oneOffBookings : oneOffBookings.filter(ob => ob.therapistId === selectedTherapistId);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* התראת שגיאה קריטית - לא נעלמת אוטומטית עד שמתקנים */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg">
          <div className="bg-red-600 text-white p-5 rounded-2xl shadow-2xl border-2 border-red-400 flex flex-col gap-3 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={28} className="animate-pulse" />
              <div className="font-bold text-lg">שגיאת סנכרון (42501 / 403)</div>
            </div>
            <div className="bg-red-700/40 p-3 rounded-lg text-sm font-mono break-all" dir="ltr">{errorMsg}</div>
            <p className="text-xs font-medium">
              הנתונים לא נשמרים בענן בגלל חוסר בהרשאות GRANT. 
              <strong>חובה להעתיק את קוד ה-SQL החדש מתחתית הדף ולהריץ אותו ב-Supabase SQL Editor.</strong>
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setErrorMsg(null); loadData(); }} className="text-xs bg-white text-red-600 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition">נסה שוב</button>
              <button onClick={() => setErrorMsg(null)} className="text-xs bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition">סגור</button>
            </div>
          </div>
        </div>
      )}

      {syncWarning && !errorMsg && (
        <div className="fixed bottom-24 right-6 z-40 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <WifiOff size={18} />
          <span className="text-xs font-bold uppercase tracking-tight">שגיאת סנכרון - בדקי הרשאות SQL</span>
        </div>
      )}

      <header className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight flex items-center gap-3">
              ClinicFlow
              {isLoading && <RefreshCw className="animate-spin text-indigo-300" size={20} />}
            </h1>
            <p className="text-gray-500 mt-1">ניהול חדרים היברידי (קבועים + חריגים)</p>
          </div>
          <button onClick={() => setIsCloudOpen(true)} className={`xl:hidden p-3 rounded-full shadow-md transition-transform active:scale-95 ${cloudActive ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}>
            {cloudActive ? <Cloud size={24} /> : <CloudOff size={24} />}
          </button>
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
            onClick={handleShareSchedule}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border shadow-sm ${
              linkCopied
                ? 'bg-green-600 border-green-700 text-white'
                : 'bg-purple-600 border-purple-700 text-white hover:bg-purple-700'
            }`}
          >
            {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
            <span className="hidden md:inline">{linkCopied ? 'הועתק!' : 'שתף לוח'}</span>
          </button>
          <button onClick={() => setIsCloudOpen(true)} className={`hidden xl:flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border shadow-sm ${cloudActive ? 'bg-green-600 border-green-700 text-white hover:bg-green-700' : 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600'}`}>
            {cloudActive ? <Cloud size={18} /> : <CloudOff size={18} />} {cloudActive ? 'מסונכרן' : 'התחבר לענן'}
          </button>
          <button onClick={() => setIsReportOpen(true)} className="bg-white text-indigo-700 border border-indigo-200 px-3 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm">
            <Calculator size={18} /> <span className="hidden md:inline">דוח תשלומים</span>
          </button>
          <button onClick={() => setIsManagerOpen(true)} className="bg-white text-gray-700 border border-gray-300 px-3 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
            <Settings size={18} /> <span className="hidden md:inline">מטפלים</span>
          </button>
          <button onClick={() => handleSlotClick()} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <CalendarIcon size={18} /> שיבוץ חדש
          </button>
        </div>
      </header>

      <main className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-center flex-1">
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm pl-2"><Filter size={18} /> <span>סינון:</span></div>
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full p-2">
              <option value="all">כל החדרים</option>
              {ROOMS.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
            <select value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full p-2">
              <option value="all">כל המטפלים</option>
              {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 md:max-w-xl">
            <Info className="text-blue-500 flex-shrink-0" size={20} />
            <div className="text-xs text-blue-800">{cloudActive ? 'הנתונים מסונכרנים בזמן אמת לענן.' : 'עבודה במצב מקומי. הנתונים נשמרים בדפדפן בלבד.'}</div>
          </div>
        </div>

        <div className="h-[650px]">
          <Calendar 
            currentDate={currentDate} viewMode={viewMode} onViewChange={setViewMode} onDateSelect={setCurrentDate}
            fixedShifts={visibleFixedShifts} oneOffBookings={visibleOneOffs} rooms={visibleRooms} therapists={therapists}
            onSlotClick={handleSlotClick}
            onDeleteEvent={(id, type) => type === 'fixed' ? handleDeleteFixed(id) : handleDeleteOneOff(id)}
          />
        </div>
        <SchemaDocs />
      </main>

      <BookingModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        onAddFixed={handleAddFixed} onAddOneOff={handleAddOneOff} 
        initialDate={formatIsoDate(currentDate)} 
        initialTime={modalInitialData.time}
        initialRoomId={modalInitialData.roomId}
        therapists={therapists} 
      />
      <TherapistManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} therapists={therapists} onAddTherapist={handleAddTherapist} onDeleteTherapist={handleDeleteTherapist} />
      <PaymentsReport isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} rooms={ROOMS} therapists={therapists} fixedShifts={fixedShifts} oneOffBookings={oneOffBookings} currentDate={currentDate} />
      <Assistant rooms={ROOMS} therapists={therapists} fixedShifts={fixedShifts} oneOffBookings={oneOffBookings} currentDate={currentDate} />
      <CloudSetup isOpen={isCloudOpen} onClose={() => setIsCloudOpen(false)} onConnected={loadData} />
    </div>
  );
};

export default App;
