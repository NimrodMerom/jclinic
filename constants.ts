
import { Room, Therapist } from './types';

export const OPENING_HOUR = 8; // 08:00
export const CLOSING_HOUR = 20; // 20:00
export const SLOT_DURATION = 30; // minutes

export const ROOMS: Room[] = [
  { id: 'room-1', name: 'חדר כחול' },
  { id: 'room-2', name: 'חדר סגול' },
  { id: 'room-3', name: 'חדר ורוד' },
  { id: 'room-4', name: 'חדר טורקיז' },
];

export const INITIAL_THERAPISTS: Therapist[] = [
  { 
    id: 'th-1', 
    name: 'יעל כהן', 
    color: 'bg-emerald-100 border-emerald-500 text-emerald-800',
    phone: '050-1234567',
    email: 'yael@clinic.com',
    paymentType: 'hourly',
    fixedShiftRate: 200,
    oneOffRate: 250
  },
];

export const WEEK_DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const SQL_SCHEMA_DOC = `
-- 1. ניקוי יסודי
DROP TABLE IF EXISTS one_off_bookings;
DROP TABLE IF EXISTS fixed_shifts;
DROP TABLE IF EXISTS therapists;

-- 2. יצירת טבלת מטפלים
CREATE TABLE therapists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    phone TEXT,
    email TEXT,
    payment_type TEXT DEFAULT 'hourly',
    fixed_shift_rate DECIMAL(10, 2),
    one_off_rate DECIMAL(10, 2)
);

-- 3. יצירת טבלת משמרות קבועות
CREATE TABLE fixed_shifts (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 4. יצירת טבלת שיבוצים חריגים
CREATE TABLE one_off_bookings (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT DEFAULT 'booking'
);

-- 5. ביטול הגנות (חובה!)
ALTER TABLE therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE one_off_bookings DISABLE ROW LEVEL SECURITY;

-- 6. הרשאות גישה מלאות
GRANT ALL ON therapists TO anon, authenticated, service_role;
GRANT ALL ON fixed_shifts TO anon, authenticated, service_role;
GRANT ALL ON one_off_bookings TO anon, authenticated, service_role;

-- 7. אופציונלי: מניעת חפיפות (רק אם btree_gist מותקן)
-- אם הפקודה הבאה נכשלת, לא נורא, השמירה עדיין תעבוד.
CREATE EXTENSION IF NOT EXISTS btree_gist;
`;
