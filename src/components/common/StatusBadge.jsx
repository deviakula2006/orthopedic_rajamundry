const StatusBadge = ({ status }) => {
  const getBadgeStyle = (state) => {
    switch (state?.toLowerCase()) {
      case 'scheduled':
        return 'border-blue-100 bg-blue-50 text-blue-700';
      case 'checked in':
      case 'checked-in':
        return 'border-indigo-100 bg-indigo-50 text-indigo-700';
      case 'in consultation':
      case 'in-consultation':
        return 'border-amber-100 bg-amber-50 text-amber-700';
      case 'completed':
        return 'border-emerald-100 bg-emerald-50 text-emerald-700';
      case 'cancelled':
        return 'border-rose-100 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-100 bg-slate-50 text-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getBadgeStyle(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
