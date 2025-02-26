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
        const apiUrl = 'https://cwscaerzmixftirytvwo.supabase.co/functions/v1/chat';
        console.log('Sending request to:', apiUrl);
        console.log('Request payload:', {
          question: `${this.getRAGContext(question)}\n\nQuestion: ${question}`,
          modelId: this.selectedModel.id
        });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            question: `${this.getRAGContext(question)}\n\nQuestion: ${question}`,
            modelId: this.selectedModel.id
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          
          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || 'Unknown error occurred';
          } catch (e) {
            errorMessage = errorText || 'Failed to get response';
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.choices?.[0]?.message?.content) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from server');
        }

        return data.choices[0].message.content;
      } catch (error) {
        console.error('AI Service Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
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