
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
-- === 1. הכנה ותוספים ===
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- === 2. ניקוי טבלאות קיימות (זהירות: מוחק נתונים קיימים ב-Supabase) ===
DROP TABLE IF EXISTS one_off_bookings CASCADE;
DROP TABLE IF EXISTS fixed_shifts CASCADE;
DROP TABLE IF EXISTS therapists CASCADE;

-- === 3. יצירת טבלאות ===
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

CREATE TABLE fixed_shifts (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    EXCLUDE USING gist (
        room_id WITH =, 
        day_of_week WITH =, 
        tsrange(
            ('2000-01-01'::date + start_time), 
            ('2000-01-01'::date + end_time)
        ) WITH &&
    )
);

CREATE TABLE one_off_bookings (
    id TEXT PRIMARY KEY,
    therapist_id TEXT REFERENCES therapists(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT DEFAULT 'booking',
    EXCLUDE USING gist (
        room_id WITH =, 
        tsrange(
            (date + start_time), 
            (date + end_time)
        ) WITH &&
    )
);

-- === 4. פתיחת הרשאות כתיבה (קריטי!!! ללא זה הנתונים יעלמו) ===
-- מבטל את ה-RLS שנועל את הטבלאות
ALTER TABLE therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE one_off_bookings DISABLE ROW LEVEL SECURITY;

-- נותן הרשאות מלאות לכל סוגי המשתמשים
GRANT ALL ON TABLE therapists TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE fixed_shifts TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE one_off_bookings TO anon, authenticated, postgres, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- === 5. הגדרות REALTIME לסנכרון מיידי ===
ALTER TABLE therapists REPLICA IDENTITY FULL;
ALTER TABLE fixed_shifts REPLICA IDENTITY FULL;
ALTER TABLE one_off_bookings REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
`;
