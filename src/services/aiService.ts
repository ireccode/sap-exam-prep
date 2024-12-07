import OpenAI from 'openai';
import { ModelConfig, MODELS } from './aiConfig';

interface RAGContext {
  getRelevantContext: (question: string) => string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class AIService {
  private readonly OPENROUTER_API_KEY: string;
  private readonly BASE_URL = 'https://openrouter.ai/api/v1';
  private selectedModel: ModelConfig;
  private ragContext: RAGContext;

  constructor(apiKey: string, ragContext: RAGContext) {
    this.OPENROUTER_API_KEY = apiKey;
    this.selectedModel = MODELS[0];
    this.ragContext = ragContext;
  }
  
    
    async setModel(modelId: string) {
      const model = MODELS.find(m => m.id === modelId);
      if (!model) throw new Error('Invalid model ID');
      this.selectedModel = model;
    }
  
    async getExplanation(question: string): Promise<string> {
      try {
        const response = await fetch(`${this.BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SAP Architect Exam Prep'
          },
          body: JSON.stringify({
            model: this.selectedModel.id,
            route: 'fallback',
            fallbacks: ['openai/gpt-3.5-turbo'], // Add fallback option
            messages: [
              {
                role: 'system',
                content: 'You are a SAP Architecture expert. Provide detailed explanations based on official SAP documentation.'
              },
              {
                role: 'user',
                content: `${this.getRAGContext(question)}\n\nQuestion: ${question}`
              }
            ],
            temperature: 0.7,
            max_tokens: this.calculateMaxTokens()
          })
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error?.message?.includes('No endpoints found')) {
            // Automatically fallback to GPT-3.5-turbo
            this.selectedModel = MODELS.find(m => m.id === 'openai/gpt-3.5-turbo')!;
            return this.getExplanation(question);
          }
          throw new Error(errorData.error?.message || 'Failed to get response');
        }
    
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('AI Service Error:', error);
        if (error instanceof Error && error.message.includes('No endpoints found')) {
          // Fallback to GPT-3.5-turbo
          this.selectedModel = MODELS.find(m => m.id === 'openai/gpt-3.5-turbo')!;
          return this.getExplanation(question);
        }
        throw error;
      }
    }
  
    private getRAGContext(question: string): string {
      // Implement RAG context retrieval logic
      return this.ragContext.getRelevantContext(question);
    }
  
    private calculateMaxTokens(): number {
      return Math.floor(this.selectedModel.contextWindow * 0.7); // Leave room for context
    }
  
    getModelList(): ModelConfig[] {
      return MODELS;
    }
  
    getCurrentModel(): ModelConfig {
      return this.selectedModel;
    }
  
    estimateCost(tokenCount: number): number {
      return (tokenCount / 1000) * this.selectedModel.costPer1kTokens;
    }
  }