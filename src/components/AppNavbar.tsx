import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Settings, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { roleColors } from '@/lib/permissions'

export function AppNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h2 className="text-sm font-semibold text-foreground">
        {user?.organization?.name || 'Organization'}
      </h2>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="font-medium text-foreground">{user?.full_name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <Badge className={`mt-1 text-[10px] ${roleColors[user?.role || 'field_agent']}`}>
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => { setOpen(false); navigate({ to: '/settings' }) }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
