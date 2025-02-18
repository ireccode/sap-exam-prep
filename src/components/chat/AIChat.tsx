import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { MODELS } from '@/services/aiConfig';
import ReactMarkdown from 'react-markdown';

const ragContext = {
  getRelevantContext: (question: string) => {
    return '';
  },
};

export function AIChat() {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);

  // Use Vite's import.meta.env instead of process.env
  const aiService = useRef(
    new AIService(import.meta.env.VITE_OPENROUTER_API_KEY || '', ragContext)
  );

  const handleModelChange = async (modelId: string) => {
    await aiService.current.setModel(modelId);
    setSelectedModel(modelId);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input },
    ];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await aiService.current.getExplanation(input);
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
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full p-2 border rounded"
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
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
