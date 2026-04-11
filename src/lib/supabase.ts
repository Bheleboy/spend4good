import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rpkivjzkgmfwnitjdmcv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2l2anprZ21md25pdGpkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjIxMzQsImV4cCI6MjA5MTEzODEzNH0.W39lIjxPR5wfjnCnWf0PYEYQG-_qoYIcHTRdrAYwClo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
