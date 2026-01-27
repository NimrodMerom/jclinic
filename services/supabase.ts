
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Therapist, FixedShift, OneOffBooking, PaymentType } from '../types';

let supabase: SupabaseClient | null = null;

const storedUrl = localStorage.getItem('supabase_url');
const storedKey = localStorage.getItem('supabase_key');

if (storedUrl && storedKey) {
  try {
    supabase = createClient(storedUrl, storedKey);
  } catch (e) {
    console.error("Failed to auto-init Supabase:", e);
  }
}

export const initSupabase = (url: string, key: string) => {
  supabase = createClient(url, key);
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  return supabase;
};

export const clearSupabaseConfig = () => {
  supabase = null;
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
};

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem('supabase_url'),
    key: localStorage.getItem('supabase_key')
  };
};

export const isCloudEnabled = () => !!supabase;

export const subscribeToChanges = (onUpdate: () => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('db-sync-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'therapists' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_shifts' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'one_off_bookings' }, onUpdate)
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
};

// Ensure time is HH:MM:SS
const formatTimeForDb = (time: string) => {
  if (!time) return '00:00:00';
  const parts = time.split(':');
  if (parts.length === 2) return `${time}:00`;
  return time;
};

const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error [${context}]:`, error);
  const code = error.code || 'UNKNOWN';
  const message = error.message || 'שגיאה לא ידועה';
  
  if (code === '42501') throw new Error(`שגיאת הרשאות (42501): השרת מסרב לקבל נתונים. נא להריץ מחדש את ה-SQL עם ה-GRANT ALL.`);
  if (code === '23503') throw new Error(`שגיאת קשר (23503): המטפל לא נמצא בשרת. נסי לשמור שוב את המטפל.`);
  
  throw new Error(`${message} (קוד: ${code})`);
};

export const db = {
  async getTherapists(): Promise<Therapist[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('therapists').select('*');
    if (error) return [];
    return data.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      phone: t.phone,
      email: t.email,
      paymentType: (t.payment_type as PaymentType) || 'hourly',
      fixedShiftRate: Number(t.fixed_shift_rate) || 0,
      oneOffRate: Number(t.one_off_rate) || 0
    }));
  },

  async saveTherapist(t: Therapist) {
    if (!supabase) return;
    const { error } = await supabase.from('therapists').upsert({
      id: t.id,
      name: t.name,
      color: t.color,
      phone: t.phone,
      email: t.email,
      payment_type: t.paymentType,
      fixed_shift_rate: t.fixedShiftRate,
      one_off_rate: t.oneOffRate
    });
    if (error) handleSupabaseError(error, 'saveTherapist');
  },

  async deleteTherapist(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('therapists').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'deleteTherapist');
  },

  async getFixedShifts(): Promise<FixedShift[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('fixed_shifts').select('*');
    if (error) return [];
    return data.map(s => ({
      id: s.id,
      therapistId: s.therapist_id,
      roomId: s.room_id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time.substring(0, 5),
      endTime: s.end_time.substring(0, 5)
    }));
  },

  async saveFixedShift(s: FixedShift) {
    if (!supabase) return;
    const { error } = await supabase.from('fixed_shifts').upsert({
      id: s.id,
      therapist_id: s.therapistId,
      room_id: s.roomId,
      day_of_week: s.dayOfWeek,
      start_time: formatTimeForDb(s.startTime),
      end_time: formatTimeForDb(s.endTime)
    });
    if (error) handleSupabaseError(error, 'saveFixedShift');
  },

  async deleteFixedShift(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('fixed_shifts').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'deleteFixedShift');
  },

  async getOneOffBookings(): Promise<OneOffBooking[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('one_off_bookings').select('*');
    if (error) return [];
    return data.map(b => ({
      id: b.id,
      therapistId: b.therapist_id,
      roomId: b.room_id,
      date: b.date,
      startTime: b.start_time.substring(0, 5),
      endTime: b.end_time.substring(0, 5),
      type: b.type
    }));
  },

  async saveOneOffBooking(b: OneOffBooking) {
    if (!supabase) return;
    const { error } = await supabase.from('one_off_bookings').upsert({
      id: b.id,
      therapist_id: b.therapistId,
      room_id: b.roomId,
      date: b.date,
      start_time: formatTimeForDb(b.startTime),
      end_time: formatTimeForDb(b.endTime),
      type: b.type || 'booking'
    });
    if (error) handleSupabaseError(error, 'saveOneOffBooking');
  },

  async deleteOneOffBooking(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('one_off_bookings').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'deleteOneOffBooking');
  }
};
