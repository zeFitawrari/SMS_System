/** Maps internal session result to Hasura LoginOutput (actions.graphql). */
export const formatLoginOutput = (session) => ({
  id: session.id,
  access_token: session.accessToken,
  /** @deprecated alias of access_token for older clients */
  token: session.accessToken,
  session_id: session.sessionId,
  session_token: session.sessionToken,
  email: session.email,
  phone: session.phone,
  first_name: session.firstName,
  last_name: session.lastName,
  school_id: session.schoolId,
  roles: session.roles,
  active_role: session.activeRole ?? null,
  active_branch_id: session.activeBranchId ?? null,
});
