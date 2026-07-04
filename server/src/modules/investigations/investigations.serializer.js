export function serializeInvestigation(row) {
  return {
    id: row.id,
    code: row.investigation_code,
    testName: row.test_name,
    category: row.category,
    price: Number(row.price),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
