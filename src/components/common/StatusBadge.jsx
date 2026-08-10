/**
 * StatusBadge — comprehensive status indicator
 *
 * Uses the badge CSS system from index.css.
 * Covers appointment, patient, billing, bed, staff states.
 */
const STATUS_MAP = {
  // Appointment
  'scheduled':       { cls: 'badge-blue',   dot: true  },
  'checked in':      { cls: 'badge-indigo', dot: true  },
  'checked-in':      { cls: 'badge-indigo', dot: true  },
  'in consultation': { cls: 'badge-amber',  dot: true  },
  'in-consultation': { cls: 'badge-amber',  dot: true  },
  'completed':       { cls: 'badge-green',  dot: true  },
  'cancelled':       { cls: 'badge-red',    dot: false },

  // Patient / general
  'active':          { cls: 'badge-green',  dot: true  },
  'inactive':        { cls: 'badge-slate',  dot: false },
  'admitted':        { cls: 'badge-blue',   dot: true  },
  'discharged':      { cls: 'badge-slate',  dot: false },

  // Billing
  'paid':            { cls: 'badge-green',  dot: true  },
  'pending':         { cls: 'badge-amber',  dot: true  },
  'partially paid':  { cls: 'badge-amber',  dot: true  },
  'overdue':         { cls: 'badge-red',    dot: true  },
  'waived':          { cls: 'badge-purple', dot: false },

  // Bed
  'vacant':          { cls: 'badge-green',  dot: true  },
  'occupied':        { cls: 'badge-red',    dot: true  },

  // Appointments check type
  'consultation':    { cls: 'badge-blue',   dot: false },
  'follow-up':       { cls: 'badge-cyan',   dot: false },
  'emergency':       { cls: 'badge-red',    dot: true  },

  // Doctor availability
  'on call':         { cls: 'badge-amber',  dot: true  },
  'available':       { cls: 'badge-green',  dot: true  },
  'unavailable':     { cls: 'badge-slate',  dot: false },
};

const StatusBadge = ({ status }) => {
  const key   = (status ?? '').toLowerCase().trim();
  const meta  = STATUS_MAP[key] ?? { cls: 'badge-slate', dot: false };

  return (
    <span className={`badge ${meta.cls}`}>
      {meta.dot && <span className="badge-dot" />}
      {status}
    </span>
  );
};

export default StatusBadge;
