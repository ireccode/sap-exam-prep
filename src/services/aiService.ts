import OpenAI from 'openai';
import { ModelConfig, MODELS } from './aiConfig';
import { getServerEnvVar } from '@/lib/env';

interface RAGContext {
  getRelevantContext: (question: string) => string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Custom error classes for better error handling
export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class AIService {
  private readonly OPENROUTER_API_KEY: string;
  private readonly BASE_URL = 'https://openrouter.ai/api/v1';
  private selectedModel: ModelConfig;
  private ragContext: RAGContext;

  constructor(ragContext: RAGContext) {
    try {
      this.OPENROUTER_API_KEY = getServerEnvVar('OPENROUTER_API_KEY');
    } catch (error) {
      throw new EnvironmentError(
        `Failed to initialize AI Service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseKey) {
          throw new EnvironmentError('Missing Supabase anonymous key');
        }

        console.log('Sending request to:', apiUrl);
        console.log('Request payload:', {
          question: `${this.getRAGContext(question)}\n\nQuestion: ${question}`,
          modelId: this.selectedModel.id
        });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey
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
          
          let errorMessage: string;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || 'Unknown error occurred';
          } catch (e) {
            errorMessage = errorText || 'Failed to get response';
          }
          
          throw new APIError(
            errorMessage,
            response.status,
            response.statusText
          );
        }

        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.choices?.[0]?.message?.content) {
          console.error('Invalid response format:', data);
          throw new APIError('Invalid response format from server');
        }

        return data.choices[0].message.content;
      } catch (error) {
        // Specific error handling based on error type
        if (error instanceof EnvironmentError) {
          console.error('Environment Configuration Error:', {
            name: error.name,
            message: error.message
          });
          throw error;
        }
        
        if (error instanceof APIError) {
          console.error('API Error:', {
            name: error.name,
            message: error.message,
            status: error.status,
            statusText: error.statusText
          });
          throw error;
        }

        // Handle unexpected errors
        console.error('Unexpected Error:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        throw new Error(
          `AI Service Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        );
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