import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  dashboard:     { title: 'Dashboard',           sub: 'Hospital overview & analytics' },
  patients:      { title: 'Patients',            sub: 'Patient directory & records' },
  doctors:       { title: 'Doctors',             sub: 'Medical staff directory' },
  receptionists: { title: 'Receptionists',       sub: 'Front desk staff' },
  appointments:  { title: 'Appointments',        sub: 'Schedule & manage appointments' },
  investigations:{ title: 'Investigations',      sub: 'Lab orders & results' },
  billing:       { title: 'Billing & Payments',  sub: 'Invoices, payments & reports' },
  beds:          { title: 'Bed Management',      sub: 'Ward & bed allocation' },
  reports:       { title: 'Reports & Analytics', sub: 'Operational reports' },
  settings:      { title: 'Settings',            sub: 'System configuration' },
};

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPage = () => {
    const path = location.pathname;
    for (const key of Object.keys(PAGE_TITLES)) {
      if (path.includes(key)) return PAGE_TITLES[key];
    }
    return { title: 'Patient Info', sub: 'Consultation workspace' };
  };

  const page = getPage();

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between px-6"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e8eaed',
        boxShadow: '0 1px 0 0 #f1f3f4',
      }}
    >
      {/* ─── Left ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" style={{ color: '#6b7280' }} />
        </button>

        {/* Page title */}
        <div>
          <h1
            className="text-[15px] leading-none"
            style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}
          >
            {page.title}
          </h1>
          <p className="mt-0.5 text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
            {page.sub}
          </p>
        </div>
      </div>

      {/* ─── Right ──────────────────────────────────── */}
      <div className="flex items-center gap-2" ref={menuRef}>
        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#e8eaed', margin: '0 4px' }} />

        {/* Profile button */}
        <button
          onClick={() => setShowMenu(v => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          style={{ border: '1px solid #e8eaed', background: '#ffffff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
        >
          {/* Avatar */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] text-white"
            style={{ background: 'linear-gradient(135deg, #2278e8, #26a1ae)', fontWeight: 700 }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-md object-cover" />
              : initials
            }
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[12px] leading-none" style={{ fontWeight: 600, color: '#111827' }}>
              {user?.name}
            </p>
            <p className="mt-0.5 text-[10px]" style={{ color: '#374151' }}>{user?.role}</p>
          </div>
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform"
            style={{ color: '#9ca3af', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Dropdown */}
        {showMenu && (
          <div
            className="dropdown-menu absolute right-6 top-14"
            style={{ minWidth: '13rem', zIndex: 100 }}
          >
            {/* Identity */}
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #f1f3f4' }}>
              <p className="text-[10px]" style={{ color: '#374151', fontWeight: 500 }}>Signed in as</p>
              <p className="mt-0.5 text-[12px] truncate" style={{ fontWeight: 700, color: '#111827' }}>{user?.email}</p>
            </div>

            {/* Actions */}
            <div className="p-1">
              <button
                className="dropdown-item"
                onClick={() => { setShowMenu(false); navigate('/admin/settings'); }}
              >
                <User className="h-3.5 w-3.5" />
                My Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => { setShowMenu(false); navigate('/admin/settings'); }}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            </div>

            <div className="p-1" style={{ borderTop: '1px solid #f1f3f4' }}>
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
