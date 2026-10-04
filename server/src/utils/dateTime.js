/**
 * Centralized Date & Time Utility for Asia/Kolkata (IST) timezone.
 * Used across backend validation, services, and formatters.
 */

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Get the current date and time in IST (Asia/Kolkata).
 * @param {Date} [referenceDate] - Optional Date object (defaults to new Date())
 * @returns {{ dateStr: string, time24: string, hours: number, minutes: number, seconds: number, totalMinutes: number }}
 */
export function getNowInIST(referenceDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // en-CA format: "YYYY-MM-DD, HH:mm:ss"
  const formatted = formatter.format(referenceDate);
  const [dateStr, timeStr] = formatted.split(', ');
  const [hoursStr, minutesStr, secondsStr] = (timeStr || '00:00:00').split(':');

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);

  return {
    dateStr,
    time24: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes
  };
}

/**
 * Converts any valid time string (12-hour "10:00 AM" or 24-hour "10:00") into normalized 24-hour "HH:mm".
 * @param {string} timeStr
 * @returns {string} "HH:mm"
 */
export function normalizeTo24Hour(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();

  // Match 12-hour format: "H:mm AM/PM" or "HH:mm AM/PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();

    if (hours < 1 || hours > 12) return '';
    if (parseInt(minutes, 10) < 0 || parseInt(minutes, 10) > 59) return '';

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Match 24-hour format: "HH:mm" or "HH:mm:ss"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours < 0 || hours > 23) return '';
    if (parseInt(minutes, 10) < 0 || parseInt(minutes, 10) > 59) return '';
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return '';
}

/**
 * Converts a 24-hour time string into a 12-hour formatted string: "10:00 AM".
 * @param {string} time24
 * @returns {string} "10:00 AM"
 */
export function formatTo12Hour(time24) {
  if (!time24 || typeof time24 !== 'string') return '';
  const normalized = normalizeTo24Hour(time24);
  if (!normalized) return time24;

  const [hoursStr, minutesStr] = normalized.split(':');
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${String(hours).padStart(2, '0')}:${minutesStr} ${modifier}`;
}

/**
 * Validates an appointment date and time against the hospital's timezone (IST).
 * Rules:
 * - Past date -> Invalid
 * - Today's date -> Time must be strictly later than the current time in IST
 * - Future date -> Valid
 *
 * @param {{ appointmentDate: string, appointmentTime: string, referenceDate?: Date }} params
 * @returns {{ valid: boolean, error?: string, normalizedTime?: string }}
 */
export function validateAppointmentDateTime({ appointmentDate, appointmentTime, referenceDate }) {
  if (!appointmentDate) {
    return { valid: false, error: 'Appointment date is required' };
  }
  if (!appointmentTime) {
    return { valid: false, error: 'Appointment time is required' };
  }

  const normalizedTime = normalizeTo24Hour(appointmentTime);
  if (!normalizedTime) {
    return { valid: false, error: 'Invalid appointment time format. Expected HH:mm AM/PM or HH:mm' };
  }

  const [aptHours, aptMinutes] = normalizedTime.split(':').map((n) => parseInt(n, 10));
  const aptTotalMinutes = aptHours * 60 + aptMinutes;

  const currentIST = getNowInIST(referenceDate);

  // Compare date strings (format YYYY-MM-DD allows alphabetical comparison)
  if (appointmentDate < currentIST.dateStr) {
    return { valid: false, error: 'Appointment date cannot be in the past' };
  }

  if (appointmentDate === currentIST.dateStr) {
    if (aptTotalMinutes <= currentIST.totalMinutes) {
      return {
        valid: false,
        error: 'For today, appointment time must be strictly later than current time'
      };
    }
  }

  return { valid: true, normalizedTime };
}
