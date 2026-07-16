  import * as dashboardRepository from './dashboard.repository.js';
  import * as activitiesRepository from '../activities/activities.repository.js';
  import { serializeActivity } from '../activities/activities.serializer.js';

  export async function getSummary() {
    const [
      patientsCount,
      activeDoctors,
      activeReceptionists,
      appointmentsToday,
      bedOccupancy,
      revenueToday,
      todayInvestigations,
      appointmentsTrendRows,
      revenueOverviewRows,
      pendingBills,
      recentActivities
    ] = await Promise.all([
      dashboardRepository.getPatientsCount(),
      dashboardRepository.getActiveDoctorsCount(),
      dashboardRepository.getActiveReceptionistsCount(),
      dashboardRepository.getAppointmentsTodayCount(),
      dashboardRepository.getBedOccupancy(),
      dashboardRepository.getRevenueToday(),
      dashboardRepository.getTodayInvestigationsCount(),
      dashboardRepository.getAppointmentsTrend(),
      dashboardRepository.getRevenueOverview(),
      dashboardRepository.getPendingBillsCount(),
      activitiesRepository.listRecent({ limit: 5, offset: 0 })
    ]);

    // Construct zero-filled 7-day trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const isoDate = d.toISOString().slice(0, 10);
      const name = d.toLocaleDateString('en-US', { weekday: 'short' });
      return { isoDate, name };
    });

    const trendData = last7Days.map(({ isoDate, name }) => {
      const match = appointmentsTrendRows.find((r) => r.date === isoDate);
      return {
        name,
        appointments: match ? match.count : 0
      };
    });

    // Construct revenue overview percentages
    const byType = {};
    revenueOverviewRows.forEach((r) => {
      byType[r.type] = Number(r.total);
    });
    const opdVal = byType.OPD ?? 0;
    const labVal = byType.Lab ?? 0;
    const ipdVal = (byType.IPD ?? 0) + (byType.Pharmacy ?? 0);
    const totalSum = opdVal + labVal + ipdVal;

    const pieData = [
      { name: 'OPD Consultations', value: totalSum > 0 ? Math.round((opdVal / totalSum) * 100) : 45 },
      { name: 'Lab Investigations', value: totalSum > 0 ? Math.round((labVal / totalSum) * 100) : 35 },
      { name: 'IPD Bed Charges', value: totalSum > 0 ? Math.round((ipdVal / totalSum) * 100) : 20 }
    ];

    return {
      totalPatients: patientsCount,
      activeDoctors,
      activeReceptionists,
      appointmentsToday,
      beds: bedOccupancy,
      revenueToday,
      todayInvestigations,
      appointmentsTrend: trendData,
      revenueOverview: pieData,
      pendingBills,
      recentActivities: recentActivities.rows.map(serializeActivity)
    };
  }
