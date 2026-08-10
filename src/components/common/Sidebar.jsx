import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  HeartPulse,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  Receipt,
  Bed,
  Settings as SettingsIcon,
  LogOut,
  X,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let navItems = [];
  if (user?.role === 'Admin') {
    navItems = [
      { name: 'Dashboard',          path: '/admin/dashboard',     icon: LayoutDashboard },
      { name: 'Patients',           path: '/admin/patients',      icon: Users },
      { name: 'Doctors',            path: '/admin/doctors',       icon: Stethoscope },
      { name: 'Receptionists',      path: '/admin/receptionists', icon: UserCheck },
      { name: 'Appointments',       path: '/admin/appointments',  icon: CalendarDays },
      { name: 'Investigations',     path: '/admin/investigations',icon: Activity },
      { name: 'Billing & Payments', path: '/admin/billing',       icon: Receipt },
      { name: 'Bed Management',     path: '/admin/beds',          icon: Bed },
      { name: 'Reports & Analytics',path: '/admin/reports',       icon: FileSpreadsheet },
      { name: 'Settings',           path: '/admin/settings',      icon: SettingsIcon },
    ];
  } else if (user?.role === 'Receptionist') {
    navItems = [
      { name: 'Dashboard',          path: '/receptionist/dashboard',     icon: LayoutDashboard },
      { name: 'Patients',           path: '/receptionist/patients',      icon: Users },
      { name: 'Appointments',       path: '/receptionist/appointments',  icon: CalendarDays },
      { name: 'Billing & Payments', path: '/receptionist/billing',       icon: Receipt },
      { name: 'Bed Management',     path: '/receptionist/beds',          icon: Bed },
      { name: 'Reports & Analytics',path: '/receptionist/reports',       icon: FileSpreadsheet },
    ];
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-[17rem] flex-col bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderRight: '1px solid #e8eaed', boxShadow: '1px 0 0 0 #f1f3f4' }}
      >
        {/* ─── Brand ──────────────────────────────────── */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5" style={{ borderBottom: '1px solid #f1f3f4' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #2278e8, #26a1ae)', boxShadow: '0 2px 4px rgba(34,120,232,0.35)' }}
            >
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-[13px] font-700 tracking-tight" style={{ color: '#0f172a', fontWeight: 700 }}>
                Rajahmundry
              </div>
              <div className="text-[10px] font-600 tracking-wider" style={{ color: '#2278e8', fontWeight: 600, letterSpacing: '0.05em' }}>
                ORTHOPEDIC HOSPITAL
              </div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X className="h-4 w-4" style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* ─── Nav ────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
              </NavLink>
            );
          })}
        </nav>

        {/* ─── User + Logout ──────────────────────────── */}
        <div className="shrink-0 px-3 pb-4 pt-2" style={{ borderTop: '1px solid #f1f3f4' }}>
          {/* User row */}
          <div
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 mb-1"
            style={{ background: '#f8f9fa' }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-700 text-white"
              style={{ background: 'linear-gradient(135deg, #2278e8, #26a1ae)', fontWeight: 700 }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-600" style={{ color: '#111827', fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</p>
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>{user?.role}</p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
            style={{ color: '#ef4444' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#ef4444'; }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
