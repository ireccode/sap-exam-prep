import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENROUTER_API_KEY = Deno.env.get('VITE_OPENROUTER_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define available models
const MODELS = [
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Llama 3.2 11B Vision Instruct',
    contextWindow: 4096,
    costPer1kTokens: 0.00,
    provider: 'Meta'
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    contextWindow: 8000,
    costPer1kTokens: 0.0002,
    provider: 'Mistral AI'
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 4096,
    costPer1kTokens: 0.0015,
    provider: 'OpenAI'
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Check for API key and validate format
    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not found in environment variables');
      throw new Error('Missing OpenRouter API key');
    }

    if (!OPENROUTER_API_KEY.startsWith('sk-or-')) {
      console.error('Invalid OpenRouter API key format - should start with sk-or-');
      throw new Error('Invalid OpenRouter API key format');
    }

    // Parse request body
    const { question, modelId } = await req.json();
    console.log('Received request with modelId:', modelId);

    if (!question) {
      throw new Error('Missing question in request body');
    }

    // Validate model ID
    const model = MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error('Invalid model ID');
    }

    console.log('Making request to OpenRouter API with model:', modelId);

    // Prepare headers for OpenRouter API request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`, // Ensure no whitespace
      'HTTP-Referer': 'https://examprep.techtreasuretrove.in',
      'X-Title': 'SAP Architect Exam Prep'
    };

    // Log API key format for debugging (safely)
    console.log('API Key validation:', {
      format: 'Bearer sk-or-****',
      length: OPENROUTER_API_KEY.length,
      startsWithCorrectPrefix: OPENROUTER_API_KEY.startsWith('sk-or-'),
      hasNoWhitespace: OPENROUTER_API_KEY.trim() === OPENROUTER_API_KEY
    });

    // Make request to OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: question }]
      })
    });

    if (!openRouterResponse.ok) {
      const error = await openRouterResponse.text();
      console.error('OpenRouter API Error:', {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        error,
        headers: Object.fromEntries(openRouterResponse.headers.entries())
      });
      throw new Error('OpenRouter API error: ' + openRouterResponse.statusText);
    }

    const data = await openRouterResponse.json();
    console.log('Received response from OpenRouter API');
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      }),
      {
        status: error.message.includes('Missing OpenRouter API key') ? 500 : 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}); 