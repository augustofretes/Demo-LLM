# LLM Features Demo

A Next.js application demonstrating various LLM capabilities including basic interactions, RAG (Retrieval Augmented Generation), tool calling, and agent loops.

## Features

### Basic LLM Calling
- Direct interaction with OpenAI's language model
- Real-time responses to user prompts
- Clean and intuitive chat-like interface

### RAG (Retrieval Augmented Generation)
- Document upload and processing
- Vector storage using Pinecone
- Semantic search and context-aware responses
- Question answering based on uploaded documents

### Tool Calling
- Integration with external tools and APIs
- Calculator functionality
- Weather information (mock)
- Web search capabilities (mock)
- Real-time tool execution visualization

### Agent Loops
- Task breakdown and planning
- Step-by-step execution
- Context preservation between steps
- Final result summarization

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Pinecone API key and index

## Setup

1. Clone the repository.

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic LLM
- Navigate to the Basic LLM page
- Enter your prompt in the text area
- Click "Send" to get a response

### RAG
- Navigate to the RAG page
- Upload a document using the file input (didn't finish the pdf parsing, so stick to simple text files, my b)
- Wait for the document to be processed
- Ask questions about the document content

### Tool Calling
- Navigate to the Tools page
- Enter a request that requires tool usage
- Watch as the system uses appropriate tools
- View the step-by-step execution

### Agent Loops
- Navigate to the Agent page
- Enter a complex task
- Observe the task breakdown and execution
- Review the final summary

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- Pinecone Vector Database
