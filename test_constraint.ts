import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
)

async function testConstraint(email: string, role: 'funder_admin' | 'admin') {
  const ts = Date.now()
  const testEmail = `${email}-${ts}@example.com`
  const password = 'TestPass123!'

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password,
  })
  if (authError || !authData.user) {
    console.error(`Auth signup failed for ${role}:`, authError?.message)
    return false
  }
  const userId = authData.user.id

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: `Test ${role} Org`,
      slug: `test-${role}-${ts}`,
      country: 'ZA',
      type: role === 'funder_admin' ? 'funder' : 'nonprofit',
      subscription_tier: role === 'funder_admin' ? 'funder_starter' : 'nonprofit_starter',
      subscription_plan: role === 'funder_admin' ? 'funder_starter' : 'nonprofit_starter',
      onboarding_status: 'pending',
    })
    .select()
    .single()
  if (orgError || !org) {
    console.error(`Org insert failed for ${role}:`, orgError?.message)
    return false
  }

  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    phone_number: null,
    whatsapp_number: null,
    org_id: org.id,
    role,
    full_name: `Test ${role}`,
    email: testEmail,
    is_active: true,
  })
  if (userError) {
    console.error(`User insert failed for ${role}:`, userError.message)
    return false
  }

  console.log(`PASS: ${role} user created with role ${role}`)
  return { userId, orgId: org.id, testEmail }
}

async function main() {
  const funderResult = await testConstraint('test-funder', 'funder_admin')
  const npoResult = await testConstraint('test-npo', 'admin')

  if (!funderResult || !npoResult) {
    console.error('Constraint test FAILED')
    process.exit(1)
  }

  // Cleanup
  if (funderResult) {
    await supabase.from('billing_details').delete().eq('org_id', funderResult.orgId)
    await supabase.from('user_roles').delete().eq('user_id', funderResult.userId)
    await supabase.from('users').delete().eq('id', funderResult.userId)
    await supabase.from('organizations').delete().eq('id', funderResult.orgId)
  }
  if (npoResult) {
    await supabase.from('billing_details').delete().eq('org_id', npoResult.orgId)
    await supabase.from('user_roles').delete().eq('user_id', npoResult.userId)
    await supabase.from('users').delete().eq('id', npoResult.userId)
    await supabase.from('organizations').delete().eq('id', npoResult.orgId)
  }

  console.log('All constraint tests passed and cleaned up')
}

main()
