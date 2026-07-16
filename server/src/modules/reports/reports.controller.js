import * as reportsService from './reports.service.js';

export async function getRevenueReport(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.getRevenueReport({ dateFrom, dateTo });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getPatientsReport(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.getPatientsReport({ dateFrom, dateTo });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getInvestigationsReport(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.getInvestigationsReport({ dateFrom, dateTo });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}
