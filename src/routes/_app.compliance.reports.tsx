import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/compliance/reports')({
  component: () => (
    <ComingSoon
      title="Report Generator"
      badge="Wave 3"
      description="AI-drafted DSD Narrative Reports powered by Claude Sonnet. Five-tab structured input with live preview and PDF export."
    />
  ),
})
