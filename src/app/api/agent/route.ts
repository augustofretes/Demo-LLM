import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { task } = await req.json();

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }

    // First, get the LLM to break down the task into steps
    const planningCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task planning assistant. Break down the given task into clear, sequential steps. Each step should be actionable and specific."
        },
        {
          role: "user",
          content: `Break down this task into steps: ${task}`
        }
      ],
      temperature: 0.7,
    });

    const stepsText = planningCompletion.choices[0].message.content;
    const steps = stepsText?.split('\n').filter(step => step.trim().length > 0) || [];

    // Execute each step
    const executedSteps = [];
    let context = '';

    for (const step of steps) {
      const stepCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a task execution assistant. Execute the given step and provide a clear result. Use any previous context if provided."
          },
          {
            role: "user",
            content: `Task: ${task}\nPrevious context: ${context}\nCurrent step: ${step}`
          }
        ],
        temperature: 0.7,
      });

      const stepResult = stepCompletion.choices[0].message.content;
      context += `\nStep: ${step}\nResult: ${stepResult}`;

      executedSteps.push({
        action: step,
        status: 'Completed',
        result: stepResult
      });
    }

    // Generate final summary
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a summarization assistant. Create a clear and concise summary of the task execution results."
        },
        {
          role: "user",
          content: `Task: ${task}\nExecution results:\n${context}\n\nProvide a final summary of the results.`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
      steps: executedSteps,
      result: summaryCompletion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in agent route:', error);
    return NextResponse.json(
      { error: 'Failed to process task' },
      { status: 500 }
    );
  }
} 