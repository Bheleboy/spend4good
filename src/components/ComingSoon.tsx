import { Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ComingSoon({
  title,
  description,
  badge,
}: {
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Construction className="h-7 w-7" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {badge && (
          <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
