import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1x1 transparent GIF
const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Update the email log status to 'Opened'
        await supabase
          .from('email_logs')
          .update({ 
            status: 'Opened',
            opened_at: new Date().toISOString()
          })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  // Always return the transparent GIF so the email client doesn't show a broken image
  return new NextResponse(transparentGif, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
