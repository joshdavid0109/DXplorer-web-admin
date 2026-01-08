import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pqljlftnbdxqhmtodwdg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGpsZnRuYmR4cWhtdG9kd2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjQ5NzcsImV4cCI6MjA2NjYwMDk3N30.SV0_ztPK09KiM-Gi6mkobtsRziO52DEhPv38t_d6Kpw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
console.log('Supabase client created:', supabase)
console.log('Supabase URL:', supabaseUrl)

// 🔍 DEBUG: log every Supabase request
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [url, options] = args;

  if (typeof url === 'string' && url.includes('supabase.co')) {
    console.log('🌐 SUPABASE REQUEST:', {
      url,
      headers: options?.headers,
    });
  }

  return originalFetch(...args);
};
