import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/whatsapp')({
  component: () => (
    <ComingSoon
      title="WhatsApp Log"
      description="Inbound message + media log from field workers via Twilio. Coming in a follow-up wave."
    />
  ),
})
