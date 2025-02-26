import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { question, modelId } = await req.json();

    if (!OPENROUTER_API_KEY) {
      throw new Error('Missing OpenRouter API key');
    }

    // Select model (default to first model if not specified)
    let selectedModel = MODELS[0];
    if (modelId) {
      const model = MODELS.find(m => m.id === modelId);
      if (!model) throw new Error('Invalid model ID');
      selectedModel = model;
    }

    const maxTokens = Math.floor(selectedModel.contextWindow * 0.7);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/ireclipse/sap-exam-prep',
        'X-Title': 'SAP Architect Exam Prep'
      },
      body: JSON.stringify({
        model: selectedModel.id,
        route: 'fallback',
        fallbacks: ['openai/gpt-3.5-turbo'],
        messages: [
          {
            role: 'system',
            content: 'You are a SAP Architecture expert. Provide detailed explanations based on official SAP documentation.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error?.message?.includes('No endpoints found')) {
        // Automatically fallback to GPT-3.5-turbo
        selectedModel = MODELS.find(m => m.id === 'openai/gpt-3.5-turbo')!;
        // Retry with fallback model
        return await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/ireclipse/sap-exam-prep',
            'X-Title': 'SAP Architect Exam Prep'
          },
          body: JSON.stringify({
            model: selectedModel.id,
            messages: [
              {
                role: 'system',
                content: 'You are a SAP Architecture expert. Provide detailed explanations based on official SAP documentation.'
              },
              {
                role: 'user',
                content: question
              }
            ],
            temperature: 0.7,
            max_tokens: maxTokens
          }),
        });
      }
      throw new Error(errorData.error?.message || 'Failed to get response');
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 