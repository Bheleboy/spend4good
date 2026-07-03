import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'
import { NonZaCompliancePlaceholder, useIsZa } from '@/components/JurisdictionGate'

export const Route = createFileRoute('/_app/compliance/')({
  component: CompliancePage,
})

function CompliancePage() {
  const { ready, isZa } = useIsZa()
  if (!ready) return null
  if (!isZa) return <NonZaCompliancePlaceholder area="Compliance Dashboard" />
  return (
    <ComingSoon
      title="South African Compliance Pack — Dashboard"
      badge="Wave 2"
      description="Compliance score, deadline timeline, and prioritised action items for DSD, CIPC, POPIA and S18A. Shipping in Wave 2."
    />
  )
}
