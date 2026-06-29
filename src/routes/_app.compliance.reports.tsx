import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Sparkles, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/compliance/reports')({
  component: ReportGeneratorPage,
})

type FormState = Record<string, string>

const initialState: FormState = {
  orgName: '',
  npoNumber: '',
  province: '',
  periodStart: '',
  periodEnd: '',
  programmeName: '',
  objectives: '',
  activities: '',
  locations: '',
  beneficiariesTotal: '',
  beneficiariesDemographics: '',
  impactStories: '',
  budgetTotal: '',
  spentTotal: '',
  expenseCategories: '',
  varianceNotes: '',
  governanceNotes: '',
  complianceStatus: '',
  challenges: '',
  lessons: '',
  plansNext: '',
}

function ReportGeneratorPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const generate = async () => {
    setLoading(true)
    setReport('')
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to generate report')
        return
      }
      setReport(data.report ?? '')
      toast.success('Report drafted')
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const previewHtml = useMemo(() => renderMarkdown(report), [report])

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DSD Narrative Report</h1>
          <p className="text-sm text-muted-foreground">
            Fill out the structured fields, then generate an AI-drafted narrative report.
          </p>
        </div>
        <Button onClick={generate} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Generate Report
            </>
          )}
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
        {/* LEFT: tabbed form */}
        <Card className="flex flex-col overflow-hidden p-4">
          <Tabs defaultValue="org" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="org">Org</TabsTrigger>
              <TabsTrigger value="programme">Programme</TabsTrigger>
              <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="governance">Governance</TabsTrigger>
            </TabsList>

            <ScrollArea className="mt-4 flex-1 pr-3">
              <TabsContent value="org" className="space-y-3">
                <Field label="Organisation name" id="orgName" value={form.orgName} onChange={set('orgName')} />
                <Field label="NPO registration #" id="npoNumber" value={form.npoNumber} onChange={set('npoNumber')} />
                <Field label="Province" id="province" value={form.province} onChange={set('province')} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Period start" id="periodStart" type="date" value={form.periodStart} onChange={set('periodStart')} />
                  <Field label="Period end" id="periodEnd" type="date" value={form.periodEnd} onChange={set('periodEnd')} />
                </div>
              </TabsContent>

              <TabsContent value="programme" className="space-y-3">
                <Field label="Programme name" id="programmeName" value={form.programmeName} onChange={set('programmeName')} />
                <AreaField label="Objectives" id="objectives" value={form.objectives} onChange={set('objectives')} />
                <AreaField label="Activities delivered" id="activities" value={form.activities} onChange={set('activities')} />
                <Field label="Locations" id="locations" value={form.locations} onChange={set('locations')} />
              </TabsContent>

              <TabsContent value="beneficiaries" className="space-y-3">
                <Field label="Total beneficiaries reached" id="beneficiariesTotal" type="number" value={form.beneficiariesTotal} onChange={set('beneficiariesTotal')} />
                <AreaField label="Demographics breakdown" id="beneficiariesDemographics" value={form.beneficiariesDemographics} onChange={set('beneficiariesDemographics')} placeholder="e.g. 60% women, 40% youth under 25, …" />
                <AreaField label="Outcomes & impact stories" id="impactStories" value={form.impactStories} onChange={set('impactStories')} />
              </TabsContent>

              <TabsContent value="financials" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Total budget (ZAR)" id="budgetTotal" type="number" value={form.budgetTotal} onChange={set('budgetTotal')} />
                  <Field label="Total spent (ZAR)" id="spentTotal" type="number" value={form.spentTotal} onChange={set('spentTotal')} />
                </div>
                <AreaField label="Major expense categories" id="expenseCategories" value={form.expenseCategories} onChange={set('expenseCategories')} />
                <AreaField label="Variance explanation" id="varianceNotes" value={form.varianceNotes} onChange={set('varianceNotes')} />
              </TabsContent>

              <TabsContent value="governance" className="space-y-3">
                <AreaField label="Governance updates" id="governanceNotes" value={form.governanceNotes} onChange={set('governanceNotes')} placeholder="Board changes, AGM, audits…" />
                <AreaField label="Compliance status" id="complianceStatus" value={form.complianceStatus} onChange={set('complianceStatus')} placeholder="NPO, SARS, B-BBEE, POPIA…" />
                <AreaField label="Key challenges" id="challenges" value={form.challenges} onChange={set('challenges')} />
                <AreaField label="Lessons learned" id="lessons" value={form.lessons} onChange={set('lessons')} />
                <AreaField label="Plans for next period" id="plansNext" value={form.plansNext} onChange={set('plansNext')} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>

        {/* RIGHT: preview */}
        <Card className="flex flex-col overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Live preview</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!report}
                onClick={() => {
                  navigator.clipboard.writeText(report)
                  toast.success('Copied')
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!report}
                onClick={() => downloadText(report, 'dsd-narrative-report.md')}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> .md
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 rounded-md border bg-background p-6">
            {loading && !report ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claude is drafting your report…
              </div>
            ) : report ? (
              <article
                className="prose prose-sm max-w-none text-foreground [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-semibold [&_h1:first-child]:mt-0 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_p]:my-2 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Fill out the form on the left and click <strong>Generate Report</strong>. The
                AI-drafted narrative will appear here.
              </p>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  id,
  ...rest
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...rest} />
    </div>
  )
}

function AreaField({
  label,
  id,
  ...rest
}: { label: string; id: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={4} {...rest} />
    </div>
  )
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Tiny safe-ish markdown renderer for headings, bold, lists, paragraphs.
function renderMarkdown(md: string): string {
  if (!md) return ''
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let inList = false
  const flushList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushList()
      continue
    }
    const h1 = /^#\s+(.*)$/.exec(line)
    const h2 = /^##\s+(.*)$/.exec(line)
    const h3 = /^###\s+(.*)$/.exec(line)
    const li = /^[-*]\s+(.*)$/.exec(line)
    const inline = (s: string) =>
      esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    if (h1) { flushList(); out.push(`<h1>${inline(h1[1])}</h1>`) }
    else if (h2) { flushList(); out.push(`<h2>${inline(h2[1])}</h2>`) }
    else if (h3) { flushList(); out.push(`<h3>${inline(h3[1])}</h3>`) }
    else if (li) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(li[1])}</li>`)
    } else {
      flushList()
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  flushList()
  return out.join('\n')
}
