
import React from 'react';
import { Car, ParkingCircle, AlertTriangle } from 'lucide-react';
import { FixedShift, OneOffBooking, Therapist, Room } from '../types';
import { mergeSchedules } from '../utils/schedulerLogic';
import { PARKING_SPOTS } from '../constants';

interface ParkingPanelProps {
  currentDate: Date;
  fixedShifts: FixedShift[];
  oneOffBookings: OneOffBooking[];
  therapists: Therapist[];
  rooms: Room[];
}

const formatTime = (d: Date) =>
  d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

export const ParkingPanel: React.FC<ParkingPanelProps> = ({
  currentDate, fixedShifts, oneOffBookings, therapists, rooms
}) => {
  const dailyEvents = mergeSchedules(rooms, fixedShifts, oneOffBookings, currentDate);
  const parkingEvents = dailyEvents
    .filter(e => e.hasParking && e.subType !== 'absence')
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const getTherapist = (id: string) => therapists.find(t => t.id === id);

  // Check if more than PARKING_SPOTS therapists overlap at any moment
  let maxOverlap = 0;
  for (let i = 0; i < parkingEvents.length; i++) {
    let count = 1;
    for (let j = 0; j < parkingEvents.length; j++) {
      if (i !== j) {
        const aStart = parkingEvents[i].start.getTime();
        const aEnd = parkingEvents[i].end.getTime();
        const bStart = parkingEvents[j].start.getTime();
        const bEnd = parkingEvents[j].end.getTime();
        if (bStart < aEnd && bEnd > aStart) count++;
      }
    }
    maxOverlap = Math.max(maxOverlap, count);
  }

  const isOverCapacity = maxOverlap > PARKING_SPOTS;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ParkingCircle size={18} className="text-indigo-600" />
          <h3 className="font-bold text-gray-700 text-sm">חניות היום</h3>
          <span className="text-xs text-gray-400 font-medium">
            ({parkingEvents.length} שוכרים | {PARKING_SPOTS} מקומות)
          </span>
        </div>
        {isOverCapacity && (
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold">
            <AlertTriangle size={13} />
            חריגה מ-{PARKING_SPOTS} מקומות בו-זמנית
          </div>
        )}
      </div>

      {parkingEvents.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2 text-center">אין שוכרי חניה היום</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {parkingEvents.map(event => {
            const therapist = getTherapist(event.therapistId);
            if (!therapist) return null;
            const colorBg = therapist.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-100';
            return (
              <div
                key={event.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${colorBg} border-current/20`}
              >
                <Car size={14} className="text-indigo-600 flex-shrink-0" />
                <span className="text-gray-800 font-semibold">{therapist.name}</span>
                <span className="text-gray-500 text-xs">
                  {formatTime(event.start)}–{formatTime(event.end)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
