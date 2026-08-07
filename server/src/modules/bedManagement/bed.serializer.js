/**
 * bed.serializer.js
 *
 * Transforms raw DB rows into clean API-response shapes.
 * No business logic here — pure data shaping.
 */

/**
 * @param {object} row - Raw ward row from the DB (includes aggregated counts + embedded beds JSON)
 */
export function serializeWard(row) {
  const beds = Array.isArray(row.beds) ? row.beds : [];
  return {
    id: row.id,
    name: row.name,
    dailyCharge: Number(row.daily_charge ?? 0),
    bedCount: Number(row.bed_count ?? 0),
    occupiedCount: Number(row.occupied_count ?? 0),
    beds: beds.map((b) => ({
      id: b.id,
      bedNumber: b.bed_number,
      status: b.status,
      patient: b.patient_id
        ? {
            id: b.patient_id,
            name: b.patient_name ?? null,
            code: b.patient_code ?? null
          }
        : null,
      admittedAt: b.admitted_at ?? null
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * @param {object} row - Raw bed row joined with ward + patient + admission data
 */
export function serializeBed(row) {
  return {
    id: row.id,
    wardId: row.ward_id,
    wardName: row.ward_name ?? null,
    dailyCharge: Number(row.daily_charge ?? 0),
    bedNumber: row.bed_number,
    status: row.status,
    patient: row.patient_id
      ? {
          id: row.patient_id,
          name: row.patient_name ?? null,
          code: row.patient_code ?? null
        }
      : null,
    admittedAt: row.admitted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
