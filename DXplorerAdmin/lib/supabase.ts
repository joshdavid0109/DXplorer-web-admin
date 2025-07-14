import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pqljlftnbdxqhmtodwdg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGpsZnRuYmR4cWhtdG9kd2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAyNDk3NywiZXhwIjoyMDY2NjAwOTc3fQ.JamG6jvx6a1L_5lwvqoUPbYrHIoLcnwmp_M3eOndwOQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
console.log('Supabase client created:', supabase)
console.log('Supabase URL:', supabaseUrl)