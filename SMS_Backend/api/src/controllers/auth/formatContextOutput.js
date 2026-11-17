export const formatContextOutput = (result) => ({
  access_token: result.accessToken,
  token: result.accessToken,
  active_role: result.activeRole,
  active_branch_id: result.activeBranchId,
  school_id: result.schoolId,
  session_id: result.sessionId,
  roles: result.availableRoles || result.allRoles || [],
});

export const formatListContextsOutput = (contexts) => ({
  contexts: contexts.map((c) => ({
    assignment_id: c.assignmentId,
    role: c.role,
    scope_type: c.scopeType,
    branch_id: c.branchId,
    branch_name: c.branchName,
    branch_code: c.branchCode,
  })),
});
