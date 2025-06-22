'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'http://localhost:3000/api/chat',
  });

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg flex flex-col" style={{ maxHeight: '80vh' }}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-lg max-w-[80%] ${
              message.role === 'user' 
                ? 'ml-auto bg-blue-500 text-white' 
                : 'bg-gray-100'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about real estate..."
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}