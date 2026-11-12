export function serializeHospitalSettings(row) {
  return {
    name: row.name,
    address: row.address,
    contactPhone: row.contact_phone,
    licenseNumber: row.license_number,
    email: row.email || 'akuladevigangabhavani@gmail.com',
    pendingEmail: row.pending_email || null,
    isEmailVerified: row.is_email_verified !== false,
    gstRate: Number(row.gst_rate ?? 0),
    updatedAt: row.updated_at
  };
}
