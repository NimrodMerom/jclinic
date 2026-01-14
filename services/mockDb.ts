import { FixedShift, OneOffBooking } from '../types';

// Initial Seed Data
const MOCK_FIXED_SHIFTS: FixedShift[] = [
  // Yael in Room 1, Sundays 08:00-14:00
  { id: 'fs-1', therapistId: 'th-1', roomId: 'room-1', dayOfWeek: 0, startTime: '08:00', endTime: '14:00' },
  // Dani in Room 2, Mondays 10:00-18:00
  { id: 'fs-2', therapistId: 'th-2', roomId: 'room-2', dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
   // Ron in Room 1, Sundays 15:00-19:00
  { id: 'fs-3', therapistId: 'th-4', roomId: 'room-1', dayOfWeek: 0, startTime: '15:00', endTime: '19:00' },
];

const MOCK_ONE_OFFS: OneOffBooking[] = [
  // Maya overrides Yael in Room 1, specifically on a Sunday between 09:00-10:00
  // Note: Date will need to be adjusted dynamically in the UI to demonstrate, 
  // but for now let's hardcode a date or leave it empty and let the App state manage it.
];

export const getInitialFixedShifts = () => MOCK_FIXED_SHIFTS;
export const getInitialOneOffs = () => MOCK_ONE_OFFS;

// Helper to generate a valid "next Sunday" for the demo
export const getNextSunday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()) % 7);
  return d.toISOString().split('T')[0];
};