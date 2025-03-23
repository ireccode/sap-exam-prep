import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )
    
    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
    
    // Get request data
    const requestData = await req.json();
    const { encryptedData, isPremium } = requestData;
    
    // Validate encrypted data
    if (!encryptedData) {
      return new Response(JSON.stringify({ error: "Missing encrypted data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
    
    // Check if data looks like HTML
    if (typeof encryptedData === 'string' && 
        (encryptedData.trim().startsWith('<!DOCTYPE') || 
         encryptedData.trim().startsWith('<html'))) {
      return new Response(JSON.stringify({ 
        error: "Received HTML instead of encrypted data",
        dataPreview: encryptedData.substring(0, 100)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
    
    // Get the appropriate encryption key
    const encryptionKey = isPremium 
      ? Deno.env.get("PREMIUM_ENCRYPTION_KEY") 
      : Deno.env.get("BASIC_ENCRYPTION_KEY")
    
    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: "Encryption key not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
    
    // Decrypt the data
    const decryptedData = await decryptData(encryptedData, encryptionKey)
    
    return new Response(JSON.stringify({ data: decryptedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      details: "See function logs for more information"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

async function decryptData(encryptedData: string, encryptionKey: string) {
  try {
    // Add error handling and logging for base64 decoding
    let data;
    try {
      // Ensure the encryptedData is properly formatted
      // Remove any whitespace or newlines that might be causing issues
      const cleanedData = encryptedData.trim().replace(/\s/g, '');
      
      data = new Uint8Array(
        atob(cleanedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );
    } catch (decodeError) {
      console.error('Base64 decoding error:', decodeError);
      console.error('First 50 chars of input:', encryptedData.substring(0, 50));
      throw new Error(`Failed to decode base64: ${decodeError.message}`);
    }

    // Extract salt, iv, and encrypted data
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    // Create text encoder/decoder
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Import key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encrypted
    );

    // Decode and parse
    const decoded = decoder.decode(decrypted);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error in decryption:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
} 