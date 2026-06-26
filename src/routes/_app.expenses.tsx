import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '@/components/ComingSoon'

export const Route = createFileRoute('/_app/expenses')({
  component: () => (
    <ComingSoon
      title="Expenses"
      description="Line-item expense tracking across projects. Coming in a follow-up wave."
    />
  ),
})
