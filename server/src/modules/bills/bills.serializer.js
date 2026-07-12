export function serializeBillItem(row) {
  return {
    id: row.id,
    investigationId: row.investigation_id,
    description: row.description,
    type: row.item_type,
    quantity: row.quantity,
    amount: Number(row.amount)
  };
}

export function serializeBill(row, items = null) {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    patient: { id: row.patient_id, code: row.patient_code, name: row.patient_name },
    doctor: row.doctor_id ? { id: row.doctor_id, code: row.doctor_code, name: row.doctor_name } : null,
    billDate: row.bill_date,
    billType: row.bill_type,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    subTotal: Number(row.sub_total),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    items: items ? items.map(serializeBillItem) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
