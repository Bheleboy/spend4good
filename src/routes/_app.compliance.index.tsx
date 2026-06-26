import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/compliance/')({
  component: () => (
    <ComingSoon
      title="Compliance Dashboard"
      badge="Wave 2"
      description="Compliance score, deadline timeline, and prioritised action items. Shipping in Wave 2 — run the SQL migration to provision the schema."
    />
  ),
})
