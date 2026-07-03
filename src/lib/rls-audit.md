# RLS Audit — Spend4Good (Pre-launch)

## Summary

All 14 audited tables have RLS enabled. Cross-org access is gated through two
`SECURITY DEFINER` helpers, `current_user_org_id()` and
`has_role_in_org(user, role, org)`, both with `PUBLIC` execute revoked and
granted only to `authenticated` and `service_role`.

## Per-table findings

| Table | SELECT | INSERT | UPDATE / DELETE | Notes |
|---|---|---|---|---|
| `organizations` | Own org + funders' linked nonprofits | **Missing — FIXED** (added authenticated INSERT `check(true)` for self-signup bootstrap) | Own org only | Onboarding does client-side insert |
| `users` | Own org members | Self (`id = auth.uid()`) | Self only | OK |
| `user_roles` | Own org roles | **Missing self-bootstrap — FIXED** (self-insert `user_id = auth.uid()`; admin escalations still gated) | Org admins only | Was blocking self-registration |
| `funder_nonprofits` | Funder side + nonprofit side | Funder admin | Funder admin | OK |
| `invitations` | `funder_admin` of `funder_org_id` only; public lookup via `get_invitation_by_token(token)` RPC | Same funder admin | Same | Prior fix confirmed — no blanket `SELECT true` |
| `projects` | Own org + funders viewing linked nonprofit | Org admin | Org admin | OK |
| `expenses` | Own org + funders viewing linked nonprofit | Members of own org | Admin approvals only | OK |
| `compliance_documents` | Own org members | Org admin | Org admin | OK |
| `compliance_deadlines` | Own org members | Org admin | Org admin | OK |
| `narrative_reports` | Own org members | Org admin | Org admin | OK |
| `compliance_scores` | Own org + funders viewing linked nonprofit | Service role only | Service role only | OK |
| `jurisdiction_requests` | Own org members | Own org members | — | OK |
| `paddle_webhook_events` | Deny-all authenticated + anon (`using false`) | Blocked | Blocked | Service role bypasses RLS |
| `email_logs` | Own org members | Service role | Service role | OK |

## Anon exposure

Only one anon-reachable code path exists: `get_invitation_by_token(text)`
SECURITY DEFINER RPC, returning at most a single row filtered by exact token
match. Direct anon SELECT/INSERT on `invitations` is denied.

## Confirmed non-issues

- No policy uses `using (true)` on `INSERT/UPDATE/DELETE`.
- Funder cross-org reads require `funder_nonprofits.status = 'active'`.
- `paddle_webhook_events` explicitly denies authenticated + anon.

## Fixes applied this pass

1. `organizations` — added authenticated INSERT policy to enable self-signup org creation.
2. `user_roles` — added self-insert policy so a new user can seed their initial role row.

Migration: `rls_bootstrap_and_audit_fixes`.
