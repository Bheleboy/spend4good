import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard, FolderKanban, FileText, Users, Settings,
  ChevronLeft, ChevronRight, Heart, Receipt, MessageCircle,
  ShieldCheck, CalendarDays, FileEdit, Archive, Activity, Mail,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean; funderAdminOnly?: boolean }
type NavSection = { label: string; badge?: string; items: NavItem[] }

const sections: NavSection[] = [
  {
    label: 'Spend Tracker',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/beneficiaries', label: 'Beneficiaries', icon: Heart },
      { to: '/documents', label: 'Documents', icon: FileText },
      { to: '/expenses', label: 'Expenses', icon: Receipt },
      { to: '/whatsapp', label: 'WhatsApp Log', icon: MessageCircle },
      { to: '/users', label: 'Users', icon: Users, adminOnly: true },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Funder',
    items: [
      { to: '/funder/dashboard', label: 'Portfolio', icon: LayoutDashboard, funderAdminOnly: true },
      { to: '/funder/invite', label: 'Invite Nonprofits', icon: Mail, funderAdminOnly: true },
    ],
  },
  {
    label: 'South African Compliance Pack',
    badge: 'NEW',
    items: [
      { to: '/compliance', label: 'Compliance Dashboard', icon: ShieldCheck },
      { to: '/compliance/calendar', label: 'Deadline Calendar', icon: CalendarDays },
      { to: '/compliance/reports', label: 'Report Generator', icon: FileEdit },
      { to: '/compliance/vault', label: 'Document Vault', icon: Archive },
      { to: '/compliance/score', label: 'Health Score', icon: Activity },
    ],
  },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  return (
    <aside className={cn(
      'flex flex-col border-r border-border bg-card transition-all duration-200',
      collapsed ? 'w-[68px]' : 'w-64'
    )}>
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-black text-primary-foreground">S4</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-foreground">Spend4Good</span>
            <span className="text-[10px] font-medium text-muted-foreground">Track. Comply. Fund.</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {sections.map((section) => {
          const items = section.items.filter(i =>
            (!i.adminOnly || user?.role === 'admin') &&
            (!i.funderAdminOnly || user?.role === 'funder_admin')
          )
          if (items.length === 0) return null
          return (
            <div key={section.label} className="space-y-0.5">
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 pb-1 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </span>
                  {section.badge && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      {section.badge}
                    </span>
                  )}
                </div>
              )}
              {items.map((item) => {
                const active = item.to === '/compliance'
                  ? location.pathname === '/compliance'
                  : location.pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
