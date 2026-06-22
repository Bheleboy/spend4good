export type UserRole =
  | 'admin'
  | 'director'
  | 'finance_manager'
  | 'project_manager'
  | 'field_officer'
  | 'agent'
  | 'funder_admin'

export type Permission =
  | 'view_all'
  | 'create_project'
  | 'add_user'
  | 'approve_doc_l1'
  | 'approve_doc_l2'
  | 'approve_doc_final'
  | 'edit_org'
  | 'view_own'
  | 'submit_doc'
  | 'view_funder_portfolio'

const permissions: Record<UserRole, Permission[]> = {
  admin: ['view_all', 'create_project', 'add_user', 'approve_doc_l1', 'approve_doc_l2', 'approve_doc_final', 'edit_org'],
  director: ['view_all', 'create_project', 'add_user', 'approve_doc_final', 'edit_org'],
  finance_manager: ['view_all', 'approve_doc_l2'],
  project_manager: ['view_all', 'create_project', 'approve_doc_l1'],
  field_officer: ['view_own', 'submit_doc'],
  agent: ['view_own', 'submit_doc'],
  funder_admin: ['view_funder_portfolio'],
}

export function hasPermission(userRole: string, action: Permission): boolean {
  return permissions[userRole as UserRole]?.includes(action) || false
}

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  director: 'bg-primary text-primary-foreground',
  finance_manager: 'bg-success text-success-foreground',
  project_manager: 'bg-[oklch(0.627_0.265_303.9)] text-primary-foreground',
  field_officer: 'bg-muted text-muted-foreground',
  agent: 'bg-muted text-muted-foreground',
  funder_admin: 'bg-[oklch(0.7_0.18_220)] text-primary-foreground',
}
