import { useId } from 'react';
import { Clock } from 'lucide-react';
import { normalizeTo24Hour } from '../../utils/dateTime';

/**
 * Normalizes an individual 12-hr component object to a padded 12-hr string.
 */
function compose12(hour, minute, ampm) {
  const h = String(parseInt(hour, 10) || 12).padStart(2, '0');
  const m = String(parseInt(minute, 10) || 0).padStart(2, '0');
  const a = ampm === 'PM' ? 'PM' : 'AM';
  return `${h}:${m} ${a}`;
}

/**
 * Parses a single 12-hour or informal time string like "08:30 AM", "8 AM", "12 AM", "16:00".
 */
function parseSingleTime(str, fallback = { hour: '08', minute: '00', ampm: 'AM' }) {
  if (!str || typeof str !== 'string') return fallback;
  const trimmed = str.trim();

  // Pattern 1: HH:MM AM/PM
  const m1 = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (m1) {
    let h = parseInt(m1[1], 10);
    if (h < 1 || h > 12) h = 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: String(parseInt(m1[2], 10) || 0).padStart(2, '0'),
      ampm: m1[3].toUpperCase()
    };
  }

  // Pattern 2: H AM/PM (e.g. "8 AM", "4 PM", "12 AM")
  const m2 = trimmed.match(/^(\d{1,2})\s*([AP]M)$/i);
  if (m2) {
    let h = parseInt(m2[1], 10);
    if (h < 1 || h > 12) h = 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: '00',
      ampm: m2[2].toUpperCase()
    };
  }

  // Pattern 3: 24-hr time
  const norm24 = normalizeTo24Hour(trimmed);
  if (norm24) {
    const [h24Str, m24Str] = norm24.split(':');
    let h24 = parseInt(h24Str, 10);
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    h24 = h24 % 12;
    const h12 = h24 ? h24 : 12;
    return {
      hour: String(h12).padStart(2, '0'),
      minute: m24Str,
      ampm
    };
  }

  return fallback;
}

/**
 * Parses full range string into { start, end }
 */
function parseShiftRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return {
      start: { hour: '08', minute: '00', ampm: 'AM' },
      end: { hour: '04', minute: '00', ampm: 'PM' }
    };
  }

  const clean = rangeStr.trim();

  // Preset check (e.g. "Morning (8 AM - 4 PM)")
  if (/morning/i.test(clean)) {
    return {
      start: { hour: '08', minute: '00', ampm: 'AM' },
      end: { hour: '04', minute: '00', ampm: 'PM' }
    };
  }
  if (/evening/i.test(clean)) {
    return {
      start: { hour: '04', minute: '00', ampm: 'PM' },
      end: { hour: '12', minute: '00', ampm: 'AM' }
    };
  }
  if (/night/i.test(clean)) {
    return {
      start: { hour: '12', minute: '00', ampm: 'AM' },
      end: { hour: '08', minute: '00', ampm: 'AM' }
    };
  }

  // Split on hyphen or en-dash/em-dash or "to"
  const parts = clean.split(/\s*(?:–|—|-|to)\s*/i);
  if (parts.length >= 2) {
    return {
      start: parseSingleTime(parts[0], { hour: '08', minute: '00', ampm: 'AM' }),
      end: parseSingleTime(parts[1], { hour: '04', minute: '00', ampm: 'PM' })
    };
  }

  return {
    start: { hour: '08', minute: '00', ampm: 'AM' },
    end: { hour: '04', minute: '00', ampm: 'PM' }
  };
}

/**
 * Calculates duration in hours and minutes between start and end.
 * Handles overnight shifts (e.g., 10:00 PM to 06:00 AM).
 */
function calculateShiftDuration(start, end) {
  const normStart = normalizeTo24Hour(compose12(start.hour, start.minute, start.ampm));
  const normEnd = normalizeTo24Hour(compose12(end.hour, end.minute, end.ampm));

  if (!normStart || !normEnd) return { hours: 8, minutes: 0, isOvernight: false };

  const [sH, sM] = normStart.split(':').map((v) => parseInt(v, 10));
  const [eH, eM] = normEnd.split(':').map((v) => parseInt(v, 10));

  const startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;
  let isOvernight = false;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60; // Next day
    isOvernight = true;
  }

  const diffMinutes = endTotal - startTotal;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return { hours, minutes, isOvernight };
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '15', '30', '45'];

/**
 * TimeRangePicker — 3-box time selector for Start Time & End Time
 * Example display: Start Time: [08] [30] [AM]  End Time: [04] [00] [PM]
 */
const TimeRangePicker = ({
  value,
  onChange,
  label = 'Shift Working Hours',
  disabled = false
}) => {
  const startHourId = useId();
  const startMinuteId = useId();
  const startAmpmId = useId();
  const endHourId = useId();
  const endMinuteId = useId();
  const endAmpmId = useId();

  const times = parseShiftRange(value);

  const update = (newTimes) => {
    const startStr = compose12(newTimes.start.hour, newTimes.start.minute, newTimes.start.ampm);
    const endStr = compose12(newTimes.end.hour, newTimes.end.minute, newTimes.end.ampm);
    const formatted = `${startStr} – ${endStr}`;
    onChange?.(formatted);
  };

  const handleStartChange = (field, val) => {
    const updated = {
      ...times,
      start: { ...times.start, [field]: val }
    };
    update(updated);
  };

  const handleEndChange = (field, val) => {
    const updated = {
      ...times,
      end: { ...times.end, [field]: val }
    };
    update(updated);
  };

  const { hours, minutes, isOvernight } = calculateShiftDuration(times.start, times.end);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          {isOvernight && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              🌙 Overnight Shift
            </span>
          )}
          <span className="text-slate-500">
            Duration: {hours}h {minutes > 0 ? `${minutes}m` : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
        {/* Start Time Section */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-hospital-500" />
            Start Time
          </span>
          <div className="flex items-center gap-1.5">
            {/* Hours */}
            <select
              id={startHourId}
              aria-label="Start Time Hours"
              disabled={disabled}
              value={times.start.hour}
              onChange={(e) => handleStartChange('hour', e.target.value)}
              className="flex-1 text-center rounded-lg border border-slate-200 bg-white py-2 px-1 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <span className="text-slate-400 font-bold">:</span>

            {/* Minutes */}
            <select
              id={startMinuteId}
              aria-label="Start Time Minutes"
              disabled={disabled}
              value={times.start.minute}
              onChange={(e) => handleStartChange('minute', e.target.value)}
              className="flex-1 text-center rounded-lg border border-slate-200 bg-white py-2 px-1 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* AM / PM */}
            <select
              id={startAmpmId}
              aria-label="Start Time Period"
              disabled={disabled}
              value={times.start.ampm}
              onChange={(e) => handleStartChange('ampm', e.target.value)}
              className="w-18 text-center rounded-lg border border-slate-200 bg-hospital-50 text-hospital-700 py-2 px-1 text-sm font-bold focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* End Time Section */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-hospital-500" />
            End Time {isOvernight && <span className="text-[10px] text-purple-600">(Next Day)</span>}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Hours */}
            <select
              id={endHourId}
              aria-label="End Time Hours"
              disabled={disabled}
              value={times.end.hour}
              onChange={(e) => handleEndChange('hour', e.target.value)}
              className="flex-1 text-center rounded-lg border border-slate-200 bg-white py-2 px-1 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <span className="text-slate-400 font-bold">:</span>

            {/* Minutes */}
            <select
              id={endMinuteId}
              aria-label="End Time Minutes"
              disabled={disabled}
              value={times.end.minute}
              onChange={(e) => handleEndChange('minute', e.target.value)}
              className="flex-1 text-center rounded-lg border border-slate-200 bg-white py-2 px-1 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* AM / PM */}
            <select
              id={endAmpmId}
              aria-label="End Time Period"
              disabled={disabled}
              value={times.end.ampm}
              onChange={(e) => handleEndChange('ampm', e.target.value)}
              className="w-18 text-center rounded-lg border border-slate-200 bg-hospital-50 text-hospital-700 py-2 px-1 text-sm font-bold focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 cursor-pointer shadow-2xs"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;
