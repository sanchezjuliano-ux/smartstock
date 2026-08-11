import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kncgrkbstyvywnoanygi.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuY2dya2JzdHl2eXdub2FueWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDczNDksImV4cCI6MjA5MDkyMzM0OX0.xuzqYHTRHIT1IuhmkFPFsZsJI24NXLB6dkfmuh_lpDY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
