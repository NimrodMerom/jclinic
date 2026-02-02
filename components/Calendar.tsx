
import React, { useMemo, useState } from 'react';
import { OPENING_HOUR, CLOSING_HOUR, SLOT_DURATION, WEEK_DAYS_HE } from '../constants';
import { FixedShift, OneOffBooking, RenderableEvent, Room, Therapist } from '../types';
import { mergeSchedules } from '../utils/schedulerLogic';
import { Clock, Calendar as CalendarIcon, UserX, Trash2, X, ExternalLink, MapPin } from 'lucide-react';

interface CalendarProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onViewChange: (mode: 'day' | 'week' | 'month') => void;
  onDateSelect: (date: Date) => void;
  fixedShifts: FixedShift[];
  oneOffBookings: OneOffBooking[];
  onSlotClick: () => void;
  rooms: Room[];
  therapists: Therapist[];
  onDeleteEvent?: (id: string, type: 'fixed' | 'one-off') => void;
}

// Native Helpers
const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

const formatTime = (date: Date): string => {
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
};

const getDifferenceInMinutes = (d1: Date, d2: Date): number => {
  return (d1.getTime() - d2.getTime()) / 60000;
};

const getMonthDays = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startObj = new Date(firstDay);
    startObj.setDate(startObj.getDate() - startObj.getDay());

    const endObj = new Date(lastDay);
    endObj.setDate(endObj.getDate() + (6 - endObj.getDay()));

    const days = [];
    let curr = new Date(startObj);
    while (curr <= endObj) {
        days.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
    }
    return days;
};

const getWeekDays = (baseDate: Date): Date[] => {
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        days.push(day);
    }
    return days;
};

export const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, viewMode, onViewChange, onDateSelect, fixedShifts, oneOffBookings, onSlotClick, rooms, therapists, onDeleteEvent
}) => {
  const [selectedDaySummary, setSelectedDaySummary] = useState<Date | null>(null);
  
  // FIX: Move all hooks to top level, never call them conditionally
  const timeSlots = useMemo(() => {
    const slots = [];
    let currentTime = new Date(currentDate);
    currentTime.setHours(OPENING_HOUR, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(CLOSING_HOUR, 0, 0, 0);
    while (getDifferenceInMinutes(endTime, currentTime) > 0) {
      slots.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, SLOT_DURATION);
    }
    return slots;
  }, [currentDate]);

  const dailyEvents = useMemo(() => {
    return mergeSchedules(rooms, fixedShifts, oneOffBookings, currentDate);
  }, [rooms, fixedShifts, oneOffBookings, currentDate]);

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const summaryEvents = useMemo(() => {
    if (!selectedDaySummary) return [];
    return mergeSchedules(rooms, fixedShifts, oneOffBookings, selectedDaySummary)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDaySummary, rooms, fixedShifts, oneOffBookings]);

  const getTherapist = (id: string) => therapists.find(t => t.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  const handleDelete = (e: React.MouseEvent, event: RenderableEvent) => {
    e.stopPropagation();
    if (!onDeleteEvent) return;
    if (confirm(`האם למחוק את ה${event.type === 'fixed' ? 'משמרת הקבועה' : 'הזמנה'}?`)) {
      onDeleteEvent(event.originalRefId, event.type);
    }
  };

  const getEventStyle = (event: RenderableEvent, forDate?: Date) => {
    const dayStart = new Date(forDate || currentDate);
    dayStart.setHours(OPENING_HOUR, 0, 0, 0);
    const startMins = getDifferenceInMinutes(event.start, dayStart);
    const durationMins = getDifferenceInMinutes(event.end, event.start);
    const totalDayMinutes = (CLOSING_HOUR - OPENING_HOUR) * 60;
    return {
      top: `${(startMins / totalDayMinutes) * 100}%`,
      height: `${(durationMins / totalDayMinutes) * 100}%`,
    };
  };

  // --- RENDERING ---

  if (viewMode === 'day') {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-20 flex-shrink-0 border-l border-gray-200 bg-gray-50 flex items-center justify-center p-2">
             <Clock className="text-gray-400" size={20} />
          </div>
          {rooms.map(room => (
            <div key={room.id} className="flex-1 p-3 text-center font-bold text-gray-700 border-l border-gray-200 last:border-l-0">
              {room.name}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto relative min-h-[600px]">
          <div className="flex absolute inset-0 min-h-full">
            <div className="w-20 flex-shrink-0 bg-gray-50 border-l border-gray-200 text-xs text-gray-500 font-medium select-none">
              {timeSlots.map((time, i) => (
                <div key={i} className="h-12 border-b border-gray-100 flex items-start justify-center pt-1" style={{ height: `${100 / timeSlots.length}%` }}>
                  {formatTime(time)}
                </div>
              ))}
            </div>
            {rooms.map((room) => (
              <div key={room.id} className="flex-1 relative border-l border-gray-200 last:border-l-0 bg-white group hover:bg-gray-50/50 transition-colors">
                {timeSlots.map((_, i) => (
                   <div key={i} className="w-full border-b border-gray-100" style={{ height: `${100 / timeSlots.length}%` }}></div>
                ))}
                <div className="absolute inset-0 cursor-pointer z-0" onClick={onSlotClick} />
                {dailyEvents.filter(e => e.roomId === room.id).map(event => {
                    const therapist = getTherapist(event.therapistId);
                    const isOneOff = event.type === 'one-off';
                    const isAbsence = event.subType === 'absence';
                    let bgClasses = therapist?.color || 'bg-gray-100 text-gray-800';
                    let borderClasses = '';
                    if (isAbsence) {
                      bgClasses = 'bg-gray-100 text-gray-500 opacity-90'; 
                      borderClasses = 'border-l-4 border-red-400';
                    } else if (isOneOff) {
                      borderClasses = 'ring-2 ring-indigo-500 ring-offset-1 z-20';
                    }
                    return (
                      <div
                        key={event.id}
                        className={`absolute inset-x-1 rounded-md p-2 text-xs border shadow-sm z-10 flex flex-col justify-between overflow-hidden transition-all hover:brightness-95 group/item ${bgClasses} ${borderClasses}`}
                        style={getEventStyle(event)}
                      >
                        {isAbsence && (
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
                        )}
                        <div className="font-bold flex items-center justify-between relative z-10">
                          <span className={`truncate ${isAbsence ? 'line-through decoration-red-500 decoration-2' : ''}`}>
                            {therapist?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {isAbsence ? (
                               <UserX size={14} className="text-red-500 flex-shrink-0" />
                            ) : isOneOff && (
                               <CalendarIcon size={12} className="text-indigo-600 flex-shrink-0" />
                            )}
                            <button onClick={(e) => handleDelete(e, event)} className="hidden group-hover/item:flex items-center justify-center p-1 hover:bg-black/10 rounded transition-colors text-red-600">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="opacity-75 relative z-10">
                           {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-6 text-sm flex-wrap">
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-500"></div>
              <span>משמרת קבועה</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-500 ring-2 ring-indigo-500 ring-offset-1"></div>
              <span>חריג / תוספת</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border-l-4 border-red-400 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '4px 4px' }}></div>
              </div>
              <span>היעדרות</span>
           </div>
        </div>
      </div>
    );
  }

  // Weekly view
  if (viewMode === 'week') {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-16 flex-shrink-0 border-l border-gray-200 bg-gray-50 flex items-center justify-center p-2">
            <Clock className="text-gray-400" size={18} />
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`flex-1 p-2 text-center border-l border-gray-200 last:border-l-0 cursor-pointer hover:bg-indigo-50 transition-colors ${isToday ? 'bg-indigo-50' : ''}`}
                onClick={() => { onDateSelect(day); onViewChange('day'); }}
              >
                <div className="text-xs text-gray-500 font-medium">{WEEK_DAYS_HE[day.getDay()]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto relative min-h-[500px]">
          <div className="flex absolute inset-0 min-h-full">
            <div className="w-16 flex-shrink-0 bg-gray-50 border-l border-gray-200 text-[10px] text-gray-500 font-medium select-none">
              {timeSlots.map((time, i) => (
                <div key={i} className="border-b border-gray-100 flex items-start justify-center pt-0.5" style={{ height: `${100 / timeSlots.length}%` }}>
                  {formatTime(time)}
                </div>
              ))}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = mergeSchedules(rooms, fixedShifts, oneOffBookings, day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={dayIndex}
                  className={`flex-1 relative border-l border-gray-200 last:border-l-0 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}
                >
                  {timeSlots.map((_, i) => (
                    <div key={i} className="w-full border-b border-gray-100" style={{ height: `${100 / timeSlots.length}%` }}></div>
                  ))}
                  <div className="absolute inset-0 cursor-pointer z-0" onClick={() => { onDateSelect(day); onSlotClick(); }} />
                  {dayEvents.map(event => {
                    const therapist = getTherapist(event.therapistId);
                    const room = getRoom(event.roomId);
                    const isOneOff = event.type === 'one-off';
                    const isAbsence = event.subType === 'absence';
                    let bgClasses = therapist?.color || 'bg-gray-100 text-gray-800';
                    let borderClasses = '';
                    if (isAbsence) {
                      bgClasses = 'bg-gray-100 text-gray-500 opacity-90';
                      borderClasses = 'border-l-2 border-red-400';
                    } else if (isOneOff) {
                      borderClasses = 'ring-1 ring-indigo-500 z-20';
                    }
                    return (
                      <div
                        key={event.id}
                        className={`absolute inset-x-0.5 rounded-sm p-0.5 text-[9px] border shadow-sm z-10 overflow-hidden transition-all hover:brightness-95 group/item ${bgClasses} ${borderClasses}`}
                        style={getEventStyle(event, day)}
                        title={`${therapist?.name} - ${room?.name}\n${formatTime(event.start)} - ${formatTime(event.end)}`}
                      >
                        <div className="font-bold truncate leading-tight">
                          {therapist?.name.split(' ')[0]}
                        </div>
                        <div className="opacity-70 truncate leading-tight hidden sm:block">
                          {room?.name.replace('חדר ', '')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></div>
            <span>קבוע</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-500 ring-1 ring-indigo-500"></div>
            <span>חריג</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 border-l-2 border-red-400"></div>
            <span>היעדרות</span>
          </div>
        </div>
      </div>
    );
  }

  // Monthly view
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
       <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEK_DAYS_HE.map((day, i) => (
            <div key={i} className="p-3 text-center font-bold text-gray-700 border-l border-gray-200 last:border-0">
               {day}
            </div>
          ))}
       </div>

       <div className="grid grid-cols-7 grid-rows-5 md:grid-rows-6 flex-1 bg-gray-200 gap-px border-b border-gray-200">
          {monthDays.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = mergeSchedules(rooms, fixedShifts, oneOffBookings, day);
            dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
            const MAX_EVENTS = 3;
            const visibleEvents = dayEvents.slice(0, MAX_EVENTS);
            const hiddenCount = dayEvents.length - MAX_EVENTS;

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedDaySummary(day)}
                className={`bg-white min-h-[100px] p-1 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-indigo-50/50 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-300' : ''
                } ${selectedDaySummary?.toDateString() === day.toDateString() ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
              >
                <div className={`text-xs font-bold p-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-gray-500'
                }`}>
                  {day.getDate()}
                </div>

                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {visibleEvents.map(event => {
                    const therapist = getTherapist(event.therapistId);
                    const isAbsence = event.subType === 'absence';
                    return (
                      <div key={event.id} className={`text-[9px] px-1 py-0.5 rounded truncate flex items-center gap-1 border-r-2 ${
                        isAbsence ? 'bg-gray-100 text-red-400 border-red-300' : (therapist?.color ? `${therapist.color} border-current` : 'bg-gray-50')
                      }`}>
                        <span className="font-bold truncate">{therapist?.name.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <div className="text-[9px] text-indigo-500 px-1 font-black flex items-center gap-1">
                      +{hiddenCount} נוספים
                    </div>
                  )}
                </div>
              </div>
            );
          })}
       </div>

       {selectedDaySummary && (
         <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
               <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg leading-tight">יום {WEEK_DAYS_HE[selectedDaySummary.getDay()]}</h3>
                    <p className="text-xs opacity-80">{selectedDaySummary.toLocaleDateString('he-IL')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedDaySummary(null); }} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
               </div>
               
               <div className="flex-1 p-4 overflow-y-auto max-h-[350px] space-y-3 bg-gray-50">
                  {summaryEvents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic text-sm">אין שיבוצים ליום זה.</div>
                  ) : (
                    summaryEvents.map(event => {
                      const therapist = getTherapist(event.therapistId);
                      const room = getRoom(event.roomId);
                      const isAbsence = event.subType === 'absence';
                      const isOneOff = event.type === 'one-off' && !isAbsence;

                      return (
                        <div key={event.id} className={`bg-white border p-3 rounded-xl shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow ${isAbsence ? 'border-red-100' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`w-1 h-10 rounded-full ${therapist?.color?.split(' ')[0] || 'bg-gray-300'}`} />
                             <div>
                               <div className="flex items-center gap-2">
                                 <span className={`font-bold text-gray-800 ${isAbsence ? 'line-through text-gray-400' : ''}`}>{therapist?.name}</span>
                                 {isAbsence && <span className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-black">היעדרות</span>}
                                 {isOneOff && <CalendarIcon size={12} className="text-indigo-500" />}
                               </div>
                               <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-medium">
                                 <div className="flex items-center gap-1">
                                   <Clock size={12} className="text-gray-400" />
                                   {formatTime(event.start)} - {formatTime(event.end)}
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <MapPin size={12} className="text-gray-400" />
                                   {room?.name}
                                 </div>
                               </div>
                             </div>
                          </div>
                          {onDeleteEvent && (
                            <button 
                              onClick={() => confirm('מחיקת אירוע?') && onDeleteEvent(event.originalRefId, event.type)}
                              className="text-gray-300 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
               </div>

               <div className="p-4 bg-white border-t flex gap-2">
                  <button 
                    onClick={() => {
                      onDateSelect(selectedDaySummary);
                      onViewChange('day');
                      setSelectedDaySummary(null);
                    }}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <ExternalLink size={18} />
                    צפייה ביום מלא
                  </button>
                  <button 
                    onClick={() => setSelectedDaySummary(null)}
                    className="flex-1 bg-gray-50 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-100"
                  >
                    סגור
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
