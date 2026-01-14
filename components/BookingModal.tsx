import React, { useState } from 'react';
import { ROOMS } from '../constants';
import { FixedShift, OneOffBooking, Therapist } from '../types';
import { X, UserX, CalendarCheck } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFixed: (shift: FixedShift) => void;
  onAddOneOff: (booking: OneOffBooking) => void;
  initialDate: string;
  therapists: Therapist[];
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, onClose, onAddFixed, onAddOneOff, initialDate, therapists 
}) => {
  const [bookingType, setBookingType] = useState<'fixed' | 'one-off'>('one-off');
  
  // New state for One-Off Subtype (Regular vs Absence)
  const [oneOffSubtype, setOneOffSubtype] = useState<'booking' | 'absence'>('booking');

  const [therapistId, setTherapistId] = useState(therapists.length > 0 ? therapists[0].id : '');
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);

  // Update therapistId if the list changes and current selection is invalid
  React.useEffect(() => {
     if (therapists.length > 0 && !therapists.find(t => t.id === therapistId)) {
       setTherapistId(therapists[0].id);
     }
  }, [therapists, therapistId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    
    if (bookingType === 'fixed') {
      onAddFixed({
        id,
        therapistId,
        roomId,
        dayOfWeek: dayOfWeek as any,
        startTime,
        endTime
      });
    } else {
      onAddOneOff({
        id,
        therapistId,
        roomId,
        date,
        startTime,
        endTime,
        type: oneOffSubtype // Pass the subtype (absence/booking)
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">הוספת שיבוץ ביומן</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Main Booking Type Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setBookingType('one-off')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                bookingType === 'one-off' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              חריג / חד-פעמי
            </button>
            <button
              type="button"
              onClick={() => setBookingType('fixed')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                bookingType === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              משמרת קבועה
            </button>
          </div>

          {/* Subtype Selector (Only for One-Off) */}
          {bookingType === 'one-off' && (
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${oneOffSubtype === 'booking' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  name="subtype" 
                  checked={oneOffSubtype === 'booking'} 
                  onChange={() => setOneOffSubtype('booking')}
                  className="hidden"
                />
                <CalendarCheck size={18} className={oneOffSubtype === 'booking' ? 'text-indigo-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${oneOffSubtype === 'booking' ? 'text-indigo-900' : 'text-gray-600'}`}>הזמנה רגילה</span>
              </label>

              <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${oneOffSubtype === 'absence' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  name="subtype" 
                  checked={oneOffSubtype === 'absence'} 
                  onChange={() => setOneOffSubtype('absence')}
                  className="hidden"
                />
                <UserX size={18} className={oneOffSubtype === 'absence' ? 'text-red-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${oneOffSubtype === 'absence' ? 'text-red-900' : 'text-gray-600'}`}>היעדרות</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מטפל/ת</label>
            <select 
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {therapists.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">חדר</label>
              <select 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {ROOMS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            
            {bookingType === 'one-off' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">יום בשבוע</label>
                <select 
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={0}>ראשון</option>
                  <option value={1}>שני</option>
                  <option value={2}>שלישי</option>
                  <option value={3}>רביעי</option>
                  <option value={4}>חמישי</option>
                  <option value={5}>שישי</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">התחלה</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיום</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className={`w-full py-2 rounded-md font-medium text-white shadow-lg transition-colors ${
                 bookingType === 'one-off' && oneOffSubtype === 'absence' 
                 ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                 : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {bookingType === 'one-off' && oneOffSubtype === 'absence' ? 'שמור היעדרות' : 'שמור שיבוץ'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            {bookingType === 'one-off' 
              ? (oneOffSubtype === 'absence' 
                  ? 'היעדרות תדרוס את המשמרת הקבועה (המקום יישמר למטפל).'
                  : 'הזמנה חד-פעמית תדרוס משמרת קבועה קיימת באותן שעות.')
              : 'שיבוץ זה יחזור על עצמו בכל שבוע.'}
          </p>
        </form>
      </div>
    </div>
  );
};