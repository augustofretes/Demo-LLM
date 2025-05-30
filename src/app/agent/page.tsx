'use client';

import { useState } from 'react';

export default function Agent() {
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalResult, setFinalResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSteps([]);
    setFinalResult('');
    
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });
      
      const data = await res.json();
      setSteps(data.steps);
      setFinalResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      setFinalResult('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Agent Loops Demo</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Example Tasks</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Research a topic and summarize the findings</li>
          <li>Plan a trip itinerary</li>
          <li>Analyze a problem and propose solutions</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your task
          </label>
          <textarea
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Try: 'Research the impact of AI on healthcare and summarize the key findings'"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !task.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Execute Task'}
        </button>
      </form>

      {steps.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Execution Steps</h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                    Step {index + 1}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {step.status}
                  </span>
                </div>
                <p className="font-medium mb-2">{step.action}</p>
                {step.result && (
                  <p className="text-sm text-gray-600">{step.result}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {finalResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Final Result</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{finalResult}</p>
          </div>
        </div>
      )}
    </div>
  );
} 