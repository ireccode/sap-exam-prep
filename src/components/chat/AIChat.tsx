import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Brain } from 'lucide-react';
import { AIService } from '@/services/aiService';
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

  // Use Vite's import.meta.env instead of process.env
  const aiService = useRef(
    new AIService(import.meta.env.VITE_OPENROUTER_API_KEY || '', ragContext)
  );

  useEffect(() => {
    if (location.state?.query) {
      setInput(location.state.query);
      sendMessage(location.state.query);
    }
  }, [location.state]);

  const handleModelChange = async (modelId: string) => {
    await aiService.current.setModel(modelId);
    setSelectedModel(modelId);
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

    try {
      const response = await aiService.current.getExplanation(messageToSend);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'Sorry, there was an error processing your request. The model might be temporarily unavailable. Please try another model or try again later.',
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
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full max-w-xs p-2 border rounded ml-4"
        >
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {`${model.name} (${model.provider} - $${model.costPer1kTokens}/1k tokens)`}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
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
