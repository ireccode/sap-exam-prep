import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { EnvironmentError } from './errors.ts';
import { MODELS, systemPrompt, ModelConfig } from './config.ts';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      console.error('OpenRouter API key not found');
      throw new EnvironmentError('Missing OPENROUTER_API_KEY in environment');
    }

    // Add debug logging
    console.log('API Key validation:', {
      exists: !!openRouterKey,
      length: openRouterKey.length,
      startsWithCorrectPrefix: openRouterKey.startsWith('sk-or-')
    });

    const { question, modelId } = await req.json();

    // Validate model ID
    const selectedModel = MODELS.find(m => m.id === modelId);
    if (modelId && !selectedModel) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sap-architect-exam-prep.netlify.app',
        'X-Title': 'SAP Architect Exam Prep'
      },
      body: JSON.stringify({
        model: modelId || MODELS[0].id, // Use first model as default
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenRouter API error');
    }

    return new Response(await response.text(), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }),
      { 
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  }
}); 