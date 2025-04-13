// Import types from aiConfig
export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kTokens: number;
  provider: string;
}

// Use the same models as in aiConfig.ts
export const MODELS: ModelConfig[] = [
  {
    id: 'meta-llama/llama-4-scout:free',
    name: 'Llama 4 Scout',
    contextWindow: 8096,
    costPer1kTokens: 0.00,
    provider: 'Meta'
  },
  {
    id: 'google/gemini-2.0-flash-thinking-exp:free',
    name: 'Gemini 2.0 Flash Thinking',
    contextWindow: 8000,
    costPer1kTokens: 0.00,
    provider: 'Google'
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Llama 3.2 11B Vision Instruct',
    contextWindow: 8096,
    costPer1kTokens: 0.00,
    provider: 'Meta'
  }
];

// Use the same system prompt as in aiConfig.ts
export const systemPrompt = `You are an AI assistant specializing in SAP Business Technology Platform (BTP) architecture. Your primary function is to provide detailed explanations for SAP BTP certification exam questions, specifically for the SAP Certified Professional - Solution Architect - SAP BTP (P_BTPA_2408) certification.
When given a brief explanation from an exam question, your task is to:
1. Expand on the concept with accurate, in-depth information from official SAP documentation.
2. Provide relevant examples of how the concept applies in real-world SAP BTP scenarios.
3. Highlight key points that are crucial for the certification exam.
4. Explain any related SAP BTP services, integration points, or best practices.
5. Use technical terms accurately and provide brief definitions where necessary.
Ensure your responses are clear, concise, and directly relevant to the SAP BTP Solution Architect role. Focus on practical application of knowledge and architectural considerations. If there are multiple interpretations or approaches, mention them briefly.
Avoid including any information not directly related to SAP BTP or the certification exam topics. Do not provide specific exam questions or answers, but rather focus on explaining concepts thoroughly. Do not provide links.`; 