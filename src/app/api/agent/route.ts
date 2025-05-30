import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the tool schema
const defineTwoStepPlanTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "define_two_step_plan",
    description: "Defines a 2-step plan to accomplish the given task. Each step must be actionable and specific.",
    parameters: {
      type: "object",
      properties: {
        step1_name: {
          type: "string",
          description: "A short, descriptive name for the first step."
        },
        step1_description: {
          type: "string",
          description: "A detailed description of the actions to be performed in the first step."
        },
        step2_name: {
          type: "string",
          description: "A short, descriptive name for the second step."
        },
        step2_description: {
          type: "string",
          description: "A detailed description of the actions to be performed in the second step."
        }
      },
      required: ["step1_name", "step1_description", "step2_name", "step2_description"]
    }
  }
};

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a task planning assistant. Break down the given task into exactly 2 clear, sequential steps. Use the 'define_two_step_plan' tool to structure your response. Each step should be actionable and specific."
        },
        {
          role: "user",
          content: `Break down this task into steps: ${task}`
        }
      ],
      tools: [defineTwoStepPlanTool],
      tool_choice: { type: "function", function: { name: "define_two_step_plan" } },
      temperature: 0.7,
    });

    const message = planningCompletion.choices[0].message;
    let plannedSteps: Array<{ name: string; description: string }> = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === "function" && toolCall.function.name === "define_two_step_plan") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          if (args.step1_name && args.step1_description && args.step2_name && args.step2_description) {
            plannedSteps = [
              { name: args.step1_name, description: args.step1_description },
              { name: args.step2_name, description: args.step2_description },
            ];
          } else {
            throw new Error("Tool arguments are missing required fields: step1_name, step1_description, step2_name, step2_description.");
          }
        } catch (e: any) {
          console.error("Failed to parse tool arguments or arguments invalid:", e.message);
          return NextResponse.json(
            { error: `Failed to process planning tool arguments: ${e.message}` },
            { status: 500 }
          );
        }
      } else {
         console.error("Expected tool 'define_two_step_plan' not called or wrong tool type. Called:", toolCall.function.name);
         return NextResponse.json(
            { error: "LLM did not use the 'define_two_step_plan' tool as expected." },
            { status: 500 }
        );
      }
    } else {
      console.error("No tool calls found in planning response. Message content:", message.content);
      return NextResponse.json(
        { error: 'LLM failed to generate a plan using the required tool. No tool_calls present.' },
        { status: 500 }
      );
    }

    // Execute each step
    const executedSteps = [];
    let context = '';

    for (const step of plannedSteps) {
      const stepCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a task execution assistant. Execute the given step and provide a clear result. Use any previous context if provided."
          },
          {
            role: "user",
            content: `Task: ${task}\nPrevious context: ${context}\nCurrent step: ${step.name} - ${step.description}`
          }
        ],
        temperature: 0.7,
      });

      const stepResult = stepCompletion.choices[0].message.content;
      if (stepResult === null || stepResult === undefined) {
        console.error(`Execution step "${step.name}" resulted in null or undefined content.`);
        return NextResponse.json(
            { error: `Execution of step "${step.name}" failed to produce content.` },
            { status: 500 }
        );
      }
      console.log(`Result for step "${step.name}":`, stepResult);
      context += `\nStep: ${step.name} - ${step.description}\nResult: ${stepResult}`;

      executedSteps.push({
        action: `${step.name}: ${step.description}`,
        status: 'Completed',
        result: stepResult
      });
    }

    // Generate final summary
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
    console.log(summaryCompletion.choices[0].message.content);

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