/** Default Hasura role when JWT lists multiple allowed roles (until context selection). */
export const DEFAULT_ROLE_PRIORITY = [
  'SUPER_PROVIDER_ADMIN',
  'PROVIDER_ADMIN',
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'BRANCH_ADMIN',
  'FINANCE',
  'TEACHER',
  'RECEPTIONIST',
  'LIBRARIAN',
  'PARENT',
  'STUDENT',
  'SCHOOL_STAFF',
];

export const pickDefaultRole = (roles = []) => {
  for (const name of DEFAULT_ROLE_PRIORITY) {
    if (roles.includes(name)) return name;
  }
  return roles[0] || 'SCHOOL_ADMIN';
};
