export function serializeHospitalSettings(row) {
  return {
    name: row.name,
    address: row.address,
    contactPhone: row.contact_phone,
    licenseNumber: row.license_number,
    updatedAt: row.updated_at
  };
}
