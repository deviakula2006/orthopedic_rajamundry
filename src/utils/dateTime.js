/**
 * Centralized Date & Time Utility for Asia/Kolkata (IST) timezone.
 * Used for React appointment booking form validation and formatting.
 */

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date and time in IST.
 * @param {Date} [referenceDate]
 * @returns {{ dateStr: string, time24: string, hours: number, minutes: number, totalMinutes: number }}
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

  const formatted = formatter.format(referenceDate);
  const [dateStr, timeStr] = formatted.split(', ');
  const [hoursStr, minutesStr] = (timeStr || '00:00').split(':');

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return {
    dateStr,
    time24: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes
  };
}

/**
 * Converts any time string (e.g. "10:00 AM", "02:30 PM", "14:30") to normalized 24-hour "HH:mm".
 */
export function normalizeTo24Hour(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();

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
 * Converts 24-hour or any valid time to 12-hour "10:00 AM".
 */
export function formatTo12Hour(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const normalized = normalizeTo24Hour(timeStr);
  if (!normalized) return timeStr;

  const [hoursStr, minutesStr] = normalized.split(':');
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${String(hours).padStart(2, '0')}:${minutesStr} ${modifier}`;
}

/**
 * Parses a 12-hour or 24-hour string into individual components: { hour: '10', minute: '00', ampm: 'AM' }.
 */
export function parseTimeComponents(timeStr) {
  const formatted = formatTo12Hour(timeStr) || '10:00 AM';
  const match = formatted.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (match) {
    return {
      hour: String(parseInt(match[1], 10)),
      minute: match[2],
      ampm: match[3].toUpperCase()
    };
  }
  return { hour: '10', minute: '00', ampm: 'AM' };
}

/**
 * Composes { hour, minute, ampm } into a 12-hour time string: "10:00 AM".
 */
export function composeTime12Hour(hour, minute, ampm) {
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (isNaN(h) || h < 1 || h > 12) return '';
  if (isNaN(m) || m < 0 || m > 59) return '';
  const validAmpm = ampm === 'PM' ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${validAmpm}`;
}

/**
 * Validates appointment date and time for booking in IST.
 * @param {{ appointmentDate: string, appointmentTime: string }} params
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAppointmentDateTime({ appointmentDate, appointmentTime }) {
  if (!appointmentDate) {
    return { valid: false, error: 'Appointment date is required' };
  }
  if (!appointmentTime) {
    return { valid: false, error: 'Appointment time is required' };
  }

  const normalizedTime = normalizeTo24Hour(appointmentTime);
  if (!normalizedTime) {
    return { valid: false, error: 'Please enter a valid time (e.g. 10:00 AM)' };
  }

  const [aptHours, aptMinutes] = normalizedTime.split(':').map((n) => parseInt(n, 10));
  const aptTotalMinutes = aptHours * 60 + aptMinutes;

  const currentIST = getNowInIST();

  if (appointmentDate < currentIST.dateStr) {
    return { valid: false, error: 'Appointment date cannot be in the past' };
  }

  if (appointmentDate === currentIST.dateStr) {
    if (aptTotalMinutes <= currentIST.totalMinutes) {
      return {
        valid: false,
        error: `Selected time (${formatTo12Hour(appointmentTime)}) has already passed today. Please select a future time.`
      };
    }
  }

  return { valid: true };
}
