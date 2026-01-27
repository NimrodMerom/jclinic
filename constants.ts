
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
-- 1. ניקוי לוחות
DROP TABLE IF EXISTS one_off_bookings;
DROP TABLE IF EXISTS fixed_shifts;
DROP TABLE IF EXISTS therapists;

-- 2. יצירת טבלאות
CREATE TABLE therapists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    phone TEXT,
    email TEXT,
    payment_type TEXT,
    fixed_shift_rate DECIMAL,
    one_off_rate DECIMAL
);

CREATE TABLE fixed_shifts (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE one_off_bookings (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT DEFAULT 'booking'
);

-- 3. ביטול אבטחת שורות (חובה!)
ALTER TABLE therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE one_off_bookings DISABLE ROW LEVEL SECURITY;

-- 4. הענקת הרשאות מלאות (זה מה שחיפשת!)
GRANT ALL ON therapists TO anon, authenticated, service_role;
GRANT ALL ON fixed_shifts TO anon, authenticated, service_role;
GRANT ALL ON one_off_bookings TO anon, authenticated, service_role;

-- 5. הענקת הרשאות גורפת לכל הסכימה הציבורית
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- וידוא הרשאות למשתמש האנונימי
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
`;
