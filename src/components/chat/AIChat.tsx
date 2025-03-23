import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Brain, HelpCircle } from 'lucide-react';
import { AIService, EnvironmentError, APIError } from '@/services/aiService';
import { MODELS } from '@/services/aiConfig';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import { useExamStore } from '@/store/useExamStore';

const ragContext = {
  getRelevantContext: (question: string) => {
    return '';
  },
};

function ThinkingSpinner() {
  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg animate-pulse">
      <Brain className="w-5 h-5 text-blue-600 animate-bounce" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-blue-600 font-medium">AI is thinking...</span>
    </div>
  );
}

export function AIChat() {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useExamStore(state => state.previousPath);
  const [error, setError] = useState<string | null>(null);

  // Create AI service
  const aiService = useRef(new AIService(ragContext));

  useEffect(() => {
    if (location.state?.query) {
      setInput(location.state.query);
      sendMessage(location.state.query);
    }
  }, [location.state]);

  const handleModelChange = async (modelId: string) => {
    try {
      await aiService.current.setModel(modelId);
      setSelectedModel(modelId);
    } catch (error) {
      console.error('Error changing model:', error);
      setError(error instanceof Error ? error.message : 'Failed to change model');
    }
  };

  const sendMessage = async (customInput?: string) => {
    const messageToSend = customInput || input;
    if (!messageToSend.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: messageToSend },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.current.getExplanation(messageToSend);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      let errorMessage = 'An error occurred';
      
      if (error instanceof EnvironmentError) {
        errorMessage = 'Configuration error: ' + error.message;
      } else if (error instanceof APIError) {
        errorMessage = `API error (${error.status}): ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again later.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (previousPath) {
      navigate(previousPath);
    }
  };

  const handleSendMessage = () => {
    sendMessage();
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        {previousPath && (
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to query
          </button>
        )}
        <div className="flex items-center">
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full max-w-xs p-2 border rounded"
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {`${model.name} (${model.provider} - $${model.costPer1kTokens}/1k tokens)`}
              </option>
            ))}
          </select>
          <div className="relative ml-2 group">
            <HelpCircle className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-help" />
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
              <div className="absolute -top-2 right-2 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              <p className="mb-2">Select your preferred AI model or let the system automatically handle model selection:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>If a free model is not responding, the system will automatically try the next available model</li>
                <li>You can manually select a specific model to test different responses</li>
                <li>Each model has different capabilities and costs</li>
                <li>Response quality and speed may vary between models</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="mb-4 mr-auto">
            <ThinkingSpinner />
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
