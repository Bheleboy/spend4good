import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/compliance/vault')({
  component: () => (
    <ComingSoon
      title="Document Vault"
      badge="Wave 4"
      description="Organised storage for DSD submissions, CIPC filings, audit reports, board resolutions, policies and certificates with expiry tracking."
    />
  ),
})
