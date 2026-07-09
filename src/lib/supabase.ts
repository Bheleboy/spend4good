import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rpkivjzkgmfwnitjdmcv.supabase.co'
const supabaseAnonKey = 'sb_publishable_xJNUp5sGKyh9SYR3lb5E2Q_XxEtSLfn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
