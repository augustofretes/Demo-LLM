import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool definitions
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate"
          }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "weather",
      description: "Get current weather information",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city to get weather for"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search",
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query"
          }
        },
        required: ["query"]
      }
    }
  }
];

// Tool implementations
const toolImplementations = {
  calculator: async (args: { expression: string }) => {
    try {
      // Simple evaluation - in production, use a proper math expression parser
      const result = eval(args.expression);
      return result.toString();
    } catch (error) {
      return "Error: Invalid expression";
    }
  },
  weather: async (args: { location: string }) => {
    // Mock weather data - in production, use a real weather API
    return `Weather in ${args.location}: 72°F, Sunny`;
  },
  search: async (args: { query: string }) => {
    // Mock search results - in production, use a real search API
    return `Search results for "${args.query}": [Sample result 1, Sample result 2]`;
  }
};

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const toolCalls: any[] = [];
    let messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that can use tools to accomplish tasks."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    while (true) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
      });

      const response = completion.choices[0].message;
      messages.push(response);

      if (!response.tool_calls) {
        return NextResponse.json({
          response: response.content,
          toolCalls
        });
      }

      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.function.name as keyof typeof toolImplementations;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await toolImplementations[toolName](toolArgs);
        
        toolCalls.push({
          name: toolName,
          arguments: toolArgs,
          result
        });

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id
        });
      }
    }
  } catch (error) {
    console.error('Error in tools route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 