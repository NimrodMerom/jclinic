
import React, { useState } from 'react';
import { Car, X, Plus, ParkingCircle } from 'lucide-react';
import { ParkingBooking, Therapist } from '../types';
import { PARKING_SPOTS } from '../constants';

interface ParkingPanelProps {
  date: string; // "YYYY-MM-DD"
  parkingBookings: ParkingBooking[]; // bookings for this date only
  scheduledTherapists: Therapist[]; // therapists with shifts today
  allTherapists: Therapist[];
  onAddParking: (booking: ParkingBooking) => void;
  onDeleteParking: (id: string) => void;
}

export const ParkingPanel: React.FC<ParkingPanelProps> = ({
  date,
  parkingBookings,
  scheduledTherapists,
  allTherapists,
  onAddParking,
  onDeleteParking,
}) => {
  const [selectingSpot, setSelectingSpot] = useState<1 | 2 | null>(null);

  const getBookingForSpot = (spot: 1 | 2) =>
    parkingBookings.find(p => p.spotNumber === spot);

  const getTherapist = (id: string) =>
    allTherapists.find(t => t.id === id);

  const handleAssign = (spotNumber: 1 | 2, therapistId: string) => {
    const booking: ParkingBooking = {
      id: `parking-${date}-${spotNumber}`,
      therapistId,
      date,
      spotNumber,
    };
    onAddParking(booking);
    setSelectingSpot(null);
  };

  // Therapists not yet assigned to any parking spot today
  const assignedTherapistIds = parkingBookings.map(p => p.therapistId);
  const availableTherapists = (scheduledTherapists.length > 0 ? scheduledTherapists : allTherapists)
    .filter(t => !assignedTherapistIds.includes(t.id));

  const spots = Array.from({ length: PARKING_SPOTS }, (_, i) => (i + 1) as 1 | 2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <ParkingCircle size={18} className="text-indigo-600" />
        <h3 className="font-bold text-gray-700 text-sm">חניות היום</h3>
        <span className="text-xs text-gray-400 font-medium">
          ({parkingBookings.length}/{PARKING_SPOTS} תפוסות)
        </span>
      </div>

      <div className="flex gap-3">
        {spots.map(spot => {
          const booking = getBookingForSpot(spot);
          const therapist = booking ? getTherapist(booking.therapistId) : null;
          const isSelecting = selectingSpot === spot;

          return (
            <div
              key={spot}
              className={`flex-1 rounded-xl border-2 p-3 transition-all ${
                booking
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-dashed border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Car size={14} className={booking ? 'text-indigo-600' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-gray-500">חניה {spot}</span>
                </div>
                {booking && (
                  <button
                    onClick={() => onDeleteParking(booking.id)}
                    className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="פנה חניה"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {booking && therapist ? (
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${therapist.color.split(' ')[0]}`} />
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {therapist.name}
                  </span>
                </div>
              ) : isSelecting ? (
                <div className="flex flex-col gap-1.5">
                  {availableTherapists.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">אין מטפלים זמינים</span>
                  ) : (
                    availableTherapists.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleAssign(spot, t.id)}
                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-right w-full"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.color.split(' ')[0]}`} />
                        <span className="font-medium truncate">{t.name}</span>
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setSelectingSpot(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectingSpot(spot)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors mt-1"
                >
                  <Plus size={13} />
                  שייך מטפל
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
