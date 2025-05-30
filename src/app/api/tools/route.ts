import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
]

// Tool implementations
const toolImplementations = {
  calculator: async (args: { expression: string }) => {
    try {
      // Simple evaluation - in production, use a proper math expression parser
      const result = eval(args.expression)
      return result.toString()
    } catch (error) {
      return "Error: Invalid expression"
    }
  },
  weather: async (args: { location: string }) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(args.location)}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
      console.log('Weather API URL:', url)
      
      const response = await fetch(url)
      console.log('Weather API Response Status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Weather API Error:', errorData)
        return `Weather in ${args.location} is not available`
      }

      const data = await response.json()
      console.log('Weather API Data:', data)
      return `Weather in ${args.location}: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`
    } catch (error) {
      console.error('Weather API Error:', error)
      return `Weather in ${args.location} is not available`
    }
  },
  search: async (args: { query: string }) => {
    // Mock search results - in production, use a real search API
    const mockResults = [
      { title: "Understanding Async/Await in JavaScript", url: "https://example.com/async-await-js", snippet: "A comprehensive guide to asynchronous programming in JavaScript using async/await." },
      { title: "Top 10 JavaScript Frameworks in 2024", url: "https://example.com/js-frameworks-2024", snippet: "An overview of the most popular JavaScript frameworks and libraries this year." },
      { title: "CSS Grid vs. Flexbox: Which to Choose?", url: "https://example.com/css-grid-flexbox", snippet: "Comparing CSS Grid and Flexbox for layout design, with examples and use cases." },
      { title: "Getting Started with TypeScript", url: "https://example.com/typescript-guide", snippet: "A beginner-friendly introduction to TypeScript, its features, and how to use it in your projects." },
      { title: "The Importance of Web Accessibility (a11y)", url: "https://example.com/web-accessibility", snippet: "Learn why web accessibility is crucial and how to build more inclusive web applications." }
    ]

    // Return 1 to 3 random results
    const numResults = Math.floor(Math.random() * 3) + 1
    const shuffledResults = mockResults.sort(() => 0.5 - Math.random())
    const selectedResults = shuffledResults.slice(0, numResults)

    return JSON.stringify({
      query: args.query,
      results: selectedResults
    })
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const toolCalls: any[] = []
    let messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that can use tools to accomplish tasks."
      },
      {
        role: "user",
        content: prompt
      }
    ]

    while (true) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
      })

      const response = completion.choices[0].message
      messages.push(response)

      if (!response.tool_calls) {
        return NextResponse.json({
          response: response.content,
          toolCalls
        })
      }

      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.function.name as keyof typeof toolImplementations
        const toolArgs = JSON.parse(toolCall.function.arguments)
        
        const result = await toolImplementations[toolName](toolArgs)
        
        toolCalls.push({
          name: toolName,
          arguments: toolArgs,
          result
        })

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id
        })
      }
    }
  } catch (error) {
    console.error('Error in tools route:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 