
export interface Room {
  id: string;
  name: string;
}

export type PaymentType = 'hourly' | 'perShift' | 'monthly';

export interface Therapist {
  id: string;
  name: string;
  color: string;
  phone?: string;
  email?: string;
  paymentType: PaymentType;
  fixedShiftRate?: number; // Rate applied to fixed shifts
  oneOffRate?: number;     // Rate applied to one-off bookings
}

// 0 = Sunday, 1 = Monday, etc.
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FixedShift {
  id: string;
  therapistId: string;
  roomId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface OneOffBooking {
  id: string;
  therapistId: string;
  roomId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  type?: 'booking' | 'absence'; // Default is 'booking'
}

export interface RenderableEvent {
  id: string;
  therapistId: string;
  roomId: string;
  title: string;
  start: Date;
  end: Date;
  type: 'fixed' | 'one-off';
  subType?: 'booking' | 'absence';
  isOverridden?: boolean;
  originalRefId: string;
}

export interface TimeSlot {
  time: string;
  minutesFromStart: number;
}
