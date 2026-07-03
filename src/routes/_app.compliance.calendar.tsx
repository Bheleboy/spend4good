import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'
import { NonZaCompliancePlaceholder, useIsZa } from '@/components/JurisdictionGate'

export const Route = createFileRoute('/_app/compliance/calendar')({
  component: ComplianceCalendarPage,
})

function ComplianceCalendarPage() {
  const { ready, isZa } = useIsZa()
  if (!ready) return null
  if (!isZa) return <NonZaCompliancePlaceholder area="Deadline Calendar" />
  return (
    <ComingSoon
      title="South African Compliance Pack — Deadline Calendar"
      badge="Wave 2"
      description="Monthly calendar with auto-generated DSD, CIPC, S18A, AML and POPIA deadlines plus WhatsApp reminders."
    />
  )
}
