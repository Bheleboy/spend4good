import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, Copy, Wifi } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const webhookUrl = `https://api.spend4good.com/webhooks/${user?.organization?.slug || 'org'}`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Organization</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium text-foreground">{user?.organization?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <span className="font-medium text-foreground">{user?.organization?.slug || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subscription</span>
            <Badge>{user?.organization?.subscription_tier || 'free'}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">WhatsApp Bot</h3>
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-success" />
          <span className="text-sm text-foreground">Connected</span>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">API Webhook URL</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm text-foreground">{webhookUrl}</code>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Copied!') }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Button variant="destructive" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </div>
  )
}
