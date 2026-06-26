import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

/**
 * Returns the number of compliance deadlines due within `days` (default 30)
 * for the current user's organization. Gracefully returns 0 if the
 * `compliance_deadlines` table is not yet provisioned.
 */
export function useUpcomingDeadlines(days = 30) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const orgId = user?.organization?.id
    if (!orgId) return
    const today = new Date()
    const horizon = new Date()
    horizon.setDate(today.getDate() + days)
    supabase
      .from('compliance_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'complete')
      .gte('due_date', today.toISOString().slice(0, 10))
      .lte('due_date', horizon.toISOString().slice(0, 10))
      .then(({ count, error }) => {
        if (!error && typeof count === 'number') setCount(count)
      })
  }, [user?.organization?.id, days])

  return count
}
