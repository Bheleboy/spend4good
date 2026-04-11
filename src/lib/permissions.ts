export type UserRole = 'admin' | 'project_manager' | 'accountant' | 'funder' | 'field_agent'

export type Permission = 'view_all' | 'create_project' | 'add_user' | 'approve_doc' | 'edit_org' | 'view_own'

const permissions: Record<UserRole, Permission[]> = {
  admin: ['view_all', 'create_project', 'add_user', 'approve_doc', 'edit_org'],
  project_manager: ['view_all', 'create_project', 'approve_doc'],
  accountant: ['view_all'],
  funder: ['view_all'],
  field_agent: ['view_own'],
}

export function hasPermission(userRole: string, action: Permission): boolean {
  return permissions[userRole as UserRole]?.includes(action) || false
}

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  project_manager: 'bg-primary text-primary-foreground',
  accountant: 'bg-success text-success-foreground',
  funder: 'bg-[oklch(0.627_0.265_303.9)] text-primary-foreground',
  field_agent: 'bg-muted text-muted-foreground',
}
