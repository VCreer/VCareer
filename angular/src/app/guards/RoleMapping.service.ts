const BACKEND_TO_ROUTING_ROLE: Record<string, 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE'> = {

  // EMPLOYEE 
  system_employee: 'EMPLOYEE',
  employee: 'EMPLOYEE',
  finance_employee: 'EMPLOYEE',

  // RECRUITER
  lead_recruiter: 'RECRUITER',
  hr_staff: 'RECRUITER',
  recruiter: 'RECRUITER',

  // CANDIDATE
  candidateaccount_employee: 'CANDIDATE',
  candidate: 'CANDIDATE',
};

export function getPrimaryRoutingRole(backendRoles: string[]): 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE' | null {
  const lowerRoles = backendRoles.map(r => r.toLowerCase());

  // Kiểm tra theo thứ tự ưu tiên
  if (lowerRoles.some(r => r in BACKEND_TO_ROUTING_ROLE && BACKEND_TO_ROUTING_ROLE[r] === 'EMPLOYEE')) {
    return 'EMPLOYEE';
  }
  if (lowerRoles.some(r => r in BACKEND_TO_ROUTING_ROLE && BACKEND_TO_ROUTING_ROLE[r] === 'RECRUITER')) {
    return 'RECRUITER';
  }
  if (lowerRoles.some(r => r in BACKEND_TO_ROUTING_ROLE && BACKEND_TO_ROUTING_ROLE[r] === 'CANDIDATE')) {
    return 'CANDIDATE';
  }

  return null;
}

export function hasRoutingRole(
  backendRoles: string[],
  requiredRole: 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE'
): boolean {
  return getPrimaryRoutingRole(backendRoles) === requiredRole;
}