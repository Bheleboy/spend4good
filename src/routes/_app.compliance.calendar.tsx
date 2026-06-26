import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/compliance/calendar')({
  component: () => (
    <ComingSoon
      title="Deadline Calendar"
      badge="Wave 2"
      description="Monthly calendar grid with auto-generated DSD, CIPC, S18A, AML and POPIA deadlines plus WhatsApp reminders."
    />
  ),
})
