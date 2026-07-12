export function serializeWard(row) {
  return {
    id: row.id,
    name: row.name,
    bedType: row.bed_type,
    baseRate: Number(row.base_rate)
  };
}
