export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kTokens: number;
  provider: string;
}

export const MODELS: ModelConfig[] = [
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
  },
  {
    id: 'anthropic/claude-2',
    name: 'Claude 2',
    contextWindow: 100000,
    costPer1kTokens: 0.008,
    provider: 'Anthropic'
  },
  {
    id: 'meta-llama/llama-2-70b-chat',
    name: 'Llama 2 70B',
    contextWindow: 4096,
    costPer1kTokens: 0.0007,
    provider: 'Meta'
  }
];