export function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.full_name,
    role: user.role,
    avatar: user.avatar_url,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}
