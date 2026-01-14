
import React, { useState, useEffect, useCallback } from 'react';
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
  Settings, LayoutGrid, LayoutList, Calculator, CalendarClock, Cloud, CloudOff, RefreshCw
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  const [fixedShifts, setFixedShifts] = useState<FixedShift[]>([]);
  const [oneOffBookings, setOneOffBookings] = useState<OneOffBooking[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>(INITIAL_THERAPISTS);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudActive, setCloudActive] = useState(isCloudEnabled());
  
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('all');

  // Load Data Function
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (isCloudEnabled()) {
        const [cloudTherapists, cloudFixed, cloudOneOffs] = await Promise.all([
          db.getTherapists(),
          db.getFixedShifts(),
          db.getOneOffBookings()
        ]);
        
        if (cloudTherapists.length > 0) setTherapists(cloudTherapists);
        setFixedShifts(cloudFixed || []);
        setOneOffBookings(cloudOneOffs || []);
      } else {
        // Load mock data only if not cloud and local state is empty
        if (fixedShifts.length === 0 && oneOffBookings.length === 0) {
          setFixedShifts(getInitialFixedShifts());
          setOneOffBookings(getInitialOneOffs());
        }
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fixedShifts.length, oneOffBookings.length]);

  // Initial Connection & Magic Link Handler
  useEffect(() => {
    const handleMagicLink = () => {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sb_url');
      const keyParam = params.get('sb_key');

      if (urlParam && keyParam) {
        // Save to LocalStorage and initialize Supabase
        initSupabase(decodeURIComponent(urlParam), decodeURIComponent(keyParam));
        setCloudActive(true);
        // Remove params from URL to keep it clean and prevent re-init
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    handleMagicLink();
    setCloudActive(isCloudEnabled());
    loadData();

    const unsubscribe = subscribeToChanges(() => {
      loadData(true);
    });

    return () => unsubscribe();
  }, [loadData]);

  // Handlers
  const handleAddFixed = async (shift: FixedShift) => {
    setFixedShifts(prev => [...prev, shift]);
    if (isCloudEnabled()) await db.saveFixedShift(shift);
  };

  const handleDeleteFixed = async (id: string) => {
    setFixedShifts(prev => prev.filter(s => s.id !== id));
    if (isCloudEnabled()) await db.deleteFixedShift(id);
  };

  const handleAddOneOff = async (booking: OneOffBooking) => {
    setOneOffBookings(prev => [...prev, booking]);
    if (isCloudEnabled()) await db.saveOneOffBooking(booking);
  };

  const handleDeleteOneOff = async (id: string) => {
    setOneOffBookings(prev => prev.filter(b => b.id !== id));
    if (isCloudEnabled()) await db.deleteOneOffBooking(id);
  };

  const handleAddTherapist = async (therapist: Therapist) => {
    setTherapists(prev => [...prev, therapist]);
    if (isCloudEnabled()) await db.saveTherapist(therapist);
  };

  const handleDeleteTherapist = async (id: string) => {
    setTherapists(prev => prev.filter(t => t.id !== id));
    if (isCloudEnabled()) await db.deleteTherapist(id);
  };

  const handleCloudConnected = () => {
    setCloudActive(true);
    loadData();
  };

  const next = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prev = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Filtering
  const visibleRooms = selectedRoomId === 'all' 
    ? ROOMS 
    : ROOMS.filter(r => r.id === selectedRoomId);

  const visibleFixedShifts = selectedTherapistId === 'all'
    ? fixedShifts
    : fixedShifts.filter(fs => fs.therapistId === selectedTherapistId);

  const visibleOneOffs = selectedTherapistId === 'all'
    ? oneOffBookings
    : oneOffBookings.filter(ob => ob.therapistId === selectedTherapistId);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-900">
      
      {/* Header */}
      <header className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight flex items-center gap-3">
              ClinicFlow
              {isLoading && <RefreshCw className="animate-spin text-indigo-300" size={20} />}
            </h1>
            <p className="text-gray-500 mt-1">ניהול חדרים היברידי (קבועים + חריגים)</p>
          </div>
          
          <button 
            onClick={() => setIsCloudOpen(true)}
            className={`xl:hidden p-3 rounded-full shadow-md transition-transform active:scale-95 ${cloudActive ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}
          >
            {cloudActive ? <Cloud size={24} /> : <CloudOff size={24} />}
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg order-2 md:order-1">
            <button 
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList size={16} />
              יומי
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              חודשי
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto order-1 md:order-2">
            <button
              onClick={goToToday}
              className="bg-white text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 text-indigo-600 transition-colors flex items-center gap-2"
            >
              <CalendarClock size={16} />
              <span className="hidden sm:inline">היום</span>
            </button>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto justify-between md:justify-center flex-1">
              <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg text-indigo-600 transition">
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
              
              <div className="text-center min-w-[140px] md:min-w-[200px]">
                {viewMode === 'day' ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-black text-gray-800 leading-none">{WEEK_DAYS_HE[currentDate.getDay()]}</span>
                    <span className="text-xs md:text-sm text-gray-500 font-medium">{formatDisplayDate(currentDate)}</span>
                  </div>
                ) : (
                  <span className="text-xl md:text-2xl font-black text-gray-800">{formatMonthYear(currentDate)}</span>
                )}
              </div>

              <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg text-indigo-600 transition">
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto justify-end flex-wrap">
          <button 
            onClick={() => setIsCloudOpen(true)}
            className={`hidden xl:flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border shadow-sm ${
              cloudActive 
                ? 'bg-green-600 border-green-700 text-white hover:bg-green-700' 
                : 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600'
            }`}
          >
            {cloudActive ? <Cloud size={18} /> : <CloudOff size={18} />}
            {cloudActive ? 'מסונכרן' : 'התחבר לענן'}
          </button>

          <button onClick={() => setIsReportOpen(true)} className="bg-white text-indigo-700 border border-indigo-200 px-3 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm">
            <Calculator size={18} />
            <span className="hidden md:inline">דוח תשלומים</span>
          </button>

          <button onClick={() => setIsManagerOpen(true)} className="bg-white text-gray-700 border border-gray-300 px-3 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
            <Settings size={18} />
            <span className="hidden md:inline">מטפלים</span>
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <CalendarIcon size={18} />
            שיבוץ חדש
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-center flex-1">
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm pl-2">
              <Filter size={18} />
              <span>סינון:</span>
            </div>
            
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full p-2">
              <option value="all">כל החדרים</option>
              {ROOMS.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>

            <select value={selectedTherapistId} onChange={(e) => setSelectedTherapistId(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-md focus:ring-indigo-500 block w-full p-2">
              <option value="all">כל המטפלים</option>
              {therapists.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 md:max-w-xl">
            <Info className="text-blue-500 flex-shrink-0" size={20} />
            <div className="text-xs text-blue-800">
              {cloudActive ? 'הנתונים מסונכרנים בזמן אמת לענן.' : 'עבודה במצב מקומי. הנתונים נשמרים בדפדפן בלבד.'}
            </div>
          </div>
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
            onSlotClick={() => setIsModalOpen(true)}
            onDeleteEvent={(id, type) => {
              if (type === 'fixed') handleDeleteFixed(id);
              else handleDeleteOneOff(id);
            }}
          />
        </div>

        <SchemaDocs />
      </main>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddFixed={handleAddFixed} onAddOneOff={handleAddOneOff} initialDate={formatIsoDate(currentDate)} therapists={therapists} />
      <TherapistManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} therapists={therapists} onAddTherapist={handleAddTherapist} onDeleteTherapist={handleDeleteTherapist} />
      <PaymentsReport isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} rooms={ROOMS} therapists={therapists} fixedShifts={fixedShifts} oneOffBookings={oneOffBookings} currentDate={currentDate} />
      <Assistant rooms={ROOMS} therapists={therapists} fixedShifts={fixedShifts} oneOffBookings={oneOffBookings} currentDate={currentDate} />
      <CloudSetup isOpen={isCloudOpen} onClose={() => setIsCloudOpen(false)} onConnected={handleCloudConnected} />
    </div>
  );
};

export default App;
