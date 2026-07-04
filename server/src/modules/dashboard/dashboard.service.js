import * as dashboardRepository from './dashboard.repository.js';
import * as activitiesRepository from '../activities/activities.repository.js';
import { serializeActivity } from '../activities/activities.serializer.js';

export async function getSummary() {
  const [patients, activeDoctors, appointmentsToday, bedOccupancy, revenueToday, pendingBills, recentActivities] =
    await Promise.all([
      dashboardRepository.getPatientsCount(),
      dashboardRepository.getActiveDoctorsCount(),
      dashboardRepository.getAppointmentsTodayCount(),
      dashboardRepository.getBedOccupancy(),
      dashboardRepository.getRevenueToday(),
      dashboardRepository.getPendingBillsCount(),
      activitiesRepository.listRecent({ limit: 5, offset: 0 })
    ]);

  return {
    totalPatients: patients,
    activeDoctors,
    appointmentsToday,
    beds: bedOccupancy,
    revenueToday,
    pendingBills,
    recentActivities: recentActivities.rows.map(serializeActivity)
  };
}
