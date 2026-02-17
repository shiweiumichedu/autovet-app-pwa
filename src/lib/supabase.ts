import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: ReturnType<typeof createClient>

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
  // Create a dummy client to prevent initialization errors
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () =>
            Promise.resolve({
              data: [],
              error: new Error('Supabase not configured'),
            }),
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error('Supabase not configured'),
            }),
          order: () =>
            Promise.resolve({
              data: [],
              error: new Error('Supabase not configured'),
            }),
        }),
        order: () =>
          Promise.resolve({
            data: [],
            error: new Error('Supabase not configured'),
          }),
      }),
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error('Supabase not configured'),
            }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: new Error('Supabase not configured'),
              }),
          }),
        }),
      }),
      delete: () => ({
        eq: () =>
          Promise.resolve({ error: new Error('Supabase not configured') }),
      }),
    }),
    rpc: () => Promise.resolve({ error: new Error('Supabase not configured') }),
  } as unknown as ReturnType<typeof createClient>
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
