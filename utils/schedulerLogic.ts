import { FixedShift, OneOffBooking, RenderableEvent, Room } from '../types';

/**
 * Native Date Helpers to replace date-fns
 */
const startOfDay = (d: Date): Date => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getDay = (d: Date): number => d.getDay();

// Format to YYYY-MM-DD using local time
export const toIsoDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isAfter = (d1: Date, d2: Date): boolean => d1.getTime() > d2.getTime();
const isBefore = (d1: Date, d2: Date): boolean => d1.getTime() < d2.getTime();
const isEqual = (d1: Date, d2: Date): boolean => d1.getTime() === d2.getTime();

/**
 * PARSES time string "HH:MM" into a Date object for a specific base date
 */
const setTime = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

/**
 * CORE LOGIC: Merge Fixed Shifts with One-Off Overrides
 * This function mimics what the Backend API (GET /schedule) would do.
 */
export const mergeSchedules = (
  rooms: Room[],
  fixedShifts: FixedShift[],
  oneOffBookings: OneOffBooking[],
  currentDate: Date // The specific date we are rendering (e.g., viewing a specific Tuesday)
): RenderableEvent[] => {
  
  const events: RenderableEvent[] = [];
  const dayOfWeek = getDay(currentDate);
  const dateStr = toIsoDate(currentDate);

  rooms.forEach(room => {
    // 1. Get all Fixed Shifts for this room and this day of week
    const roomFixed = fixedShifts.filter(
      f => f.roomId === room.id && f.dayOfWeek === dayOfWeek
    );

    // 2. Get all One-Off Bookings for this room and this specific date
    const roomOneOff = oneOffBookings.filter(
      o => o.roomId === room.id && o.date === dateStr
    );

    // 3. Process Fixed Shifts: Check for overlaps with One-Offs
    // We treat the Fixed Shift as a "candidate" that might get sliced or removed
    roomFixed.forEach(fixed => {
      let candidateSegments: { start: Date; end: Date }[] = [{
        start: setTime(currentDate, fixed.startTime),
        end: setTime(currentDate, fixed.endTime)
      }];

      // Check this fixed shift against ALL one-off bookings for this room/day
      // If a one-off intersects, we cut the fixed shift
      roomOneOff.forEach(oneOff => {
        const oneOffStart = setTime(currentDate, oneOff.startTime);
        const oneOffEnd = setTime(currentDate, oneOff.endTime);

        const nextSegments: { start: Date; end: Date }[] = [];

        candidateSegments.forEach(seg => {
          // Case A: No overlap
          if (isAfter(seg.start, oneOffEnd) || isEqual(seg.start, oneOffEnd) || 
              isBefore(seg.end, oneOffStart) || isEqual(seg.end, oneOffStart)) {
            nextSegments.push(seg);
            return;
          }

          // Case B: Overlap exists - we need to cut 'seg' based on 'oneOff'
          
          // Segment before the one-off
          if (isBefore(seg.start, oneOffStart)) {
            nextSegments.push({ start: seg.start, end: oneOffStart });
          }

          // Segment after the one-off
          if (isAfter(seg.end, oneOffEnd)) {
            nextSegments.push({ start: oneOffEnd, end: seg.end });
          }
          
          // If One-Off completely covers the segment, nothing is pushed.
        });

        candidateSegments = nextSegments;
      });

      // Add remaining segments of the fixed shift to the final list
      candidateSegments.forEach((seg, idx) => {
        events.push({
          id: `fixed-${fixed.id}-${idx}`,
          originalRefId: fixed.id,
          therapistId: fixed.therapistId,
          roomId: room.id,
          title: 'משמרת קבועה',
          type: 'fixed',
          start: seg.start,
          end: seg.end
        });
      });
    });

    // 4. Add all One-Off Bookings (They always show up)
    roomOneOff.forEach(oneOff => {
      events.push({
        id: `oneoff-${oneOff.id}`,
        originalRefId: oneOff.id,
        therapistId: oneOff.therapistId,
        roomId: room.id,
        title: oneOff.type === 'absence' ? 'היעדרות' : 'הזמנה חד-פעמית',
        type: 'one-off',
        subType: oneOff.type || 'booking', // Pass subType (booking or absence)
        start: setTime(currentDate, oneOff.startTime),
        end: setTime(currentDate, oneOff.endTime)
      });
    });
  });

  return events;
};