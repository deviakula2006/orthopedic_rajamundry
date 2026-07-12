import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as billsService from './bills.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await billsService.listBills({
    ...pagination,
    patientId: req.query.patientId,
    paymentStatus: req.query.paymentStatus,
    billType: req.query.billType
  });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const bill = await billsService.getBill(req.params.id);
  sendSuccess(res, { data: bill });
});

export const create = asyncHandler(async (req, res) => {
  const bill = await billsService.createBill(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: bill });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const bill = await billsService.updateBillStatus(req.params.id, req.body, req.user);
  sendSuccess(res, { data: bill });
});
