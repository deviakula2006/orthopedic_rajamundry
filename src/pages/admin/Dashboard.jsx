import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHospital } from '../../context/HospitalContext';
import {
  Users, Calendar, IndianRupee, Activity,
  Bed, ArrowUpRight, TrendingUp, Stethoscope,
  Receipt, UserCheck, BarChart3, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, PieChart, Pie, Cell
} from 'recharts';
import orthoIll from '../../assets/ortho_ill.png';
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';
import InvestigationModal from '../../components/modals/InvestigationModal';

/* ── Custom chart tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', marginBottom: 3 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color ?? '#2278e8' }}>
          {p.name}: <span style={{ color: '#0f172a' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { activities, addPatient, dashboardSummary } = useHospital();

  const [patientModalOpen,       setPatientModalOpen]       = useState(false);
  const [appointmentModalOpen,   setAppointmentModalOpen]   = useState(false);
  const [investigationModalOpen, setInvestigationModalOpen] = useState(false);

  const handleSavePatient = (data) => addPatient(data);

  /* ── KPI stat cards ── */
  const stats = useMemo(() => {
    if (!dashboardSummary) return [];
    return [
      {
        title: 'Total Patients',
        value: dashboardSummary.totalPatients,
        change: '+10%',
        timeframe: 'from last month',
        icon: Users,
        iconBg: 'linear-gradient(135deg,#3b82f6,#6366f1)',
        accentColor: '#3b82f6',
      },
      {
        title: "Today's Appointments",
        value: dashboardSummary.appointmentsToday,
        change: '+5%',
        timeframe: 'from last week',
        icon: Calendar,
        iconBg: 'linear-gradient(135deg,#2278e8,#26a1ae)',
        accentColor: '#2278e8',
      },
      {
        title: "Today's Revenue",
        value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dashboardSummary.revenueToday),
        change: '+12%',
        timeframe: 'from yesterday',
        icon: IndianRupee,
        iconBg: 'linear-gradient(135deg,#10b981,#0d9488)',
        accentColor: '#10b981',
      },
      {
        title: "Investigations Today",
        value: dashboardSummary.todayInvestigations,
        change: '+8%',
        timeframe: 'tests ordered',
        icon: Activity,
        iconBg: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
        accentColor: '#8b5cf6',
      },
    ];
  }, [dashboardSummary]);

  /* ── Directory counts ── */
  const activeDoctorsCount       = dashboardSummary?.activeDoctors ?? 0;
  const activeReceptionistsCount = dashboardSummary?.activeReceptionists ?? 0;
  const totalBedsCount           = dashboardSummary?.beds?.total ?? 0;
  const availableBedsCount       = dashboardSummary?.beds?.vacant ?? 0;

  const trendData = dashboardSummary?.appointmentsTrend ?? [];

  const pieData = useMemo(() => {
    if (!dashboardSummary) return [];
    const colors = ['#2278e8', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
    return dashboardSummary.revenueOverview.map((item, i) => ({ ...item, color: colors[i % colors.length] }));
  }, [dashboardSummary]);

  /* ── Activity icon map ── */
  const activityMeta = {
    patient:     { Icon: Users,       bg: '#eff6ff', color: '#2278e8' },
    appointment: { Icon: Calendar,    bg: '#eef2ff', color: '#4338ca' },
    billing:     { Icon: Receipt,     bg: '#f0fdf4', color: '#15803d' },
    doctor:      { Icon: Stethoscope, bg: '#faf5ff', color: '#7c3aed' },
    bed:         { Icon: Bed,         bg: '#ecfeff', color: '#0e7490' },
  };

  /* ── Loading skeleton ── */
  if (!dashboardSummary) {
    return (
      <div style={{ display: 'flex', height: '70vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e8eaed', borderTopColor: '#2278e8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Welcome Banner ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y:  0  }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #1a60d5 0%, #2278e8 45%, #26a1ae 100%)',
          padding: '1.5rem 2rem', color: '#fff',
          boxShadow: '0 4px 16px rgba(34,120,232,0.25)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ maxWidth: 560 }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '3px 12px', fontSize: '0.6875rem', fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '0.04em' }}>
              ADMIN CONTROL CENTER
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Rajahmundry Orthopedic Hospital
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', fontWeight: 400, lineHeight: 1.6 }}>
              Monitor staff, schedule consultations, allocate wards, and audit billing metrics in real-time.
            </p>
          </div>
          <img src={orthoIll} alt="Orthopedic" style={{ height: 100, opacity: 0.95, flexShrink: 0, display: 'block' }} className="hidden md:block" />
        </div>
        {/* Decorative shapes */}
        <div style={{ position: 'absolute', top: 0, right: '5%', height: '100%', width: '25%', background: 'rgba(255,255,255,0.06)', transform: 'skewX(-12deg)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: '15%', height: '100%', width: '12%', background: 'rgba(255,255,255,0.04)', transform: 'skewX(-12deg)', pointerEvents: 'none' }} />
      </motion.div>

      {/* ─── KPI Cards ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y:  0  }}
              transition={{ delay: idx * 0.06 }}
              style={{
                background: '#fff', border: '1px solid #e8eaed', borderRadius: 12,
                padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 200ms', cursor: 'default',
              }}
              whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </p>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 6px ${stat.accentColor}33` }}>
                  <Icon style={{ width: 17, height: 17, color: '#fff' }} />
                </div>
              </div>
              <p style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0a0f1e', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
                {stat.value}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.6875rem', fontWeight: 700, color: '#15803d' }}>
                  <ArrowUpRight style={{ width: 12, height: 12 }} />{stat.change}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151' }}>{stat.timeframe}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Charts Row ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="lg-chart-grid">
        {/* Area Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f4', paddingBottom: '0.875rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>OPD Appointments Trend</h3>
              <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>Weekly patient load</p>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 700, color: '#2278e8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: 6 }}>
              <TrendingUp style={{ width: 12, height: 12 }} />This Week
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2278e8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2278e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#2278e8" strokeWidth={2.5} fillOpacity={1} fill="url(#aptGrad)" dot={false} activeDot={{ r: 4, fill: '#2278e8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie / Donut Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: '1px solid #f1f3f4', paddingBottom: '0.875rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Revenue Breakdown</h3>
            <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>Monthly income by type</p>
          </div>
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0f172a' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Activities + Directory ───────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="md-two-col">

        {/* Recent Activities */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f4', paddingBottom: '0.875rem', marginBottom: '0.875rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Recent Activity</h3>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px' }}>
              Auto-updates
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 280, overflowY: 'auto' }}>
            {activities.slice(0, 6).map((act) => {
              const { Icon, bg, color } = activityMeta[act.type] ?? activityMeta.appointment;
              return (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f8f9fa' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.action}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock style={{ width: 10, height: 10, color: '#374151', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151' }}>{act.user} · {act.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Directory Audit */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: '1px solid #f1f3f4', paddingBottom: '0.875rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Quick Directory</h3>
            <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>Staff and ward summary</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1 }}>
            {[
              { label: 'Doctors',       value: `${activeDoctorsCount} panelists`,  icon: Stethoscope, bg: '#faf5ff', color: '#7c3aed' },
              { label: 'Receptionists', value: `${activeReceptionistsCount} staff`, icon: UserCheck,   bg: '#eff6ff', color: '#2278e8' },
              { label: 'Total Beds',    value: `${totalBedsCount} allocated`,       icon: Bed,         bg: '#ecfeff', color: '#0e7490' },
              { label: 'Vacant Beds',   value: `${availableBedsCount} available`,   icon: BarChart3,   bg: '#f0fdf4', color: '#15803d' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f9fa', border: '1px solid #f1f3f4', borderRadius: 10, padding: '0.875rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 16, height: 16, color: item.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#374151', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PatientModal       isOpen={patientModalOpen}       onClose={() => setPatientModalOpen(false)}       onSave={handleSavePatient} />
      <AppointmentModal   isOpen={appointmentModalOpen}   onClose={() => setAppointmentModalOpen(false)} />
      <InvestigationModal isOpen={investigationModalOpen} onClose={() => setInvestigationModalOpen(false)} />

      <style>{`
        @media (max-width: 900px) {
          .lg-chart-grid { grid-template-columns: 1fr !important; }
          .md-two-col    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
