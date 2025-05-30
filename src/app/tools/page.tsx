'use client';

import { useState } from 'react';

export default function Tools() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setToolCalls([]);
    
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      setResponse(data.response);
      if (data.toolCalls) {
        setToolCalls(data.toolCalls);
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tool Calling Demo</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Tools</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Calculator: Perform mathematical calculations</li>
          <li>Weather: Get current weather information</li>
          <li>Search: Search the web for information</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your request
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Try: 'What's the weather in New York and calculate the average temperature for the week?'"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Send Request'}
        </button>
      </form>

      {toolCalls.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Tool Calls</h2>
          <div className="space-y-4">
            {toolCalls.map((tool, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Tool: {tool.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Arguments: {JSON.stringify(tool.arguments)}</p>
                <p className="text-sm text-gray-600">Result: {tool.result}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {response && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Final Response</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
} 