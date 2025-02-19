export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kTokens: number;
  provider: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Llama 3.2 11B Vision Instruct ',
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