import Image from "next/image";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to the LLM Features Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Basic LLM Calling</h2>
          <p className="text-gray-600 mb-4">
            Experience direct interaction with OpenAI's language model. Send prompts and receive responses in real-time.
          </p>
          <a href="/basic" className="text-blue-600 hover:text-blue-800">Try it out →</a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">RAG (Retrieval Augmented Generation)</h2>
          <p className="text-gray-600 mb-4">
            See how we combine vector search with LLM responses to provide accurate, context-aware answers.
          </p>
          <a href="/rag" className="text-blue-600 hover:text-blue-800">Try it out →</a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Tool Calling</h2>
          <p className="text-gray-600 mb-4">
            Watch the LLM use external tools and APIs to accomplish complex tasks and gather information.
          </p>
          <a href="/tools" className="text-blue-600 hover:text-blue-800">Try it out →</a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Agent Loops</h2>
          <p className="text-gray-600 mb-4">
            Explore how LLMs can break down complex tasks into steps and execute them in sequence.
          </p>
          <a href="/agent" className="text-blue-600 hover:text-blue-800">Try it out →</a>
        </div>
      </div>
    </div>
  );
}
