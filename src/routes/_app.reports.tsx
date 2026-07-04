import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { ProjectReport } from '@/components/ProjectReport'

export const Route = createFileRoute('/_app/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    if (!user?.org_id) return
    supabase.from('projects').select('id, name').eq('org_id', user.org_id).order('name').then(({ data }) => {
      setProjects(data ?? [])
      if (data && data.length > 0 && !selected) setSelected(data[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.org_id])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Project expense reports for funders and internal review.</p>
        </div>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {selected ? <ProjectReport projectId={selected} /> : <Card className="p-8 text-center text-sm text-muted-foreground">Select a project to view its report</Card>}
    </div>
  )
}
