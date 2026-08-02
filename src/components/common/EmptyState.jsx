import { Database } from 'lucide-react';

const EmptyState = ({
  title = 'No Data Found',
  message = 'There are no records matching your request.',
  icon: Icon = Database,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 bg-white rounded-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-400 font-semibold max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
