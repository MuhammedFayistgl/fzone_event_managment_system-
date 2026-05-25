export function getActorFromRequest(req) {
  const admin = req.admin;
  if (admin) {
    return {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    };
  }
  if (req.user?.id) {
    return {
      id: req.user.id,
      role: req.user.role,
    };
  }
  return null;
}

export function updatedByMeta(req) {
  const actor = getActorFromRequest(req);
  if (!actor?.email) return null;
  return {
    email: actor.email,
    role: actor.role,
    at: new Date().toISOString(),
  };
}
