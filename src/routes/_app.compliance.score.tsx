import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/compliance/score')({
  component: () => (
    <ComingSoon
      title="Health Score"
      badge="Wave 4"
      description="Compliance Health gauge broken down by filing, documents, governance, financial transparency and policy coverage. Shareable funder badge."
    />
  ),
})
