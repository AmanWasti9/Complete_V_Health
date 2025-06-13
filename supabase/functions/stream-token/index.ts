import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple JWT token generation for Stream (matches Stream's expected format)
async function createStreamToken(apiKey: string, secret: string, userId: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const payload = {
    user_id: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  }

  // Base64URL encode (no padding)
  const base64UrlEncode = (obj: any) => {
    return encode(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const headerBase64 = base64UrlEncode(header)
  const payloadBase64 = base64UrlEncode(payload)
  
  const data = `${headerBase64}.${payloadBase64}`
  
  // Generate HMAC-SHA256 signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  
  // Base64URL encode signature
  const signatureBase64 = encode(new Uint8Array(signature))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${data}.${signatureBase64}`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const STREAM_API_KEY = 'v6u8szvh8ahb';
    const STREAM_SECRET = '27pubduwtgx8qv9zyaqgfacakcpv3e2qnb7v3zn4kkaw3pt36bdnw9dgm7kx53sj';
    const SUPABASE_URL = 'https://fgarksnsdfvkclhzahmq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYXJrc25zZGZ2a2NsaHphaG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2ODY5MjUsImV4cCI6MjA2NDI2MjkyNX0.hWWR-y9ZcTvgdZOp7sQpRO2f-3l2-mpgdi6YWk1BK_w';

    if (!STREAM_API_KEY || !STREAM_SECRET) {
      throw new Error('Stream credentials not configured')
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Verify the Supabase JWT token
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: { Authorization: authHeader },
      },
    })
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      console.error('Auth error:', error)
      return new Response('Invalid authentication', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Get the request body
    const { userId } = await req.json()
    
    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return new Response('User ID mismatch', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // Generate Stream token using our lightweight function
    const streamToken = await createStreamToken(STREAM_API_KEY, STREAM_SECRET, userId)

    return new Response(
      JSON.stringify({ token: streamToken }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  } catch (error) {
    console.error('Error generating Stream token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})