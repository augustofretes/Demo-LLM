import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Split text into chunks (simple implementation)
    const chunks = text.split(/\n\n+/).filter(chunk => chunk.trim().length > 0);

    // Process each chunk
    for (const chunk of chunks) {
      // Get embedding from OpenAI
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk,
      });

      // Store in Pinecone
      await index.upsert([{
        id: crypto.randomUUID(),
        values: embedding.data[0].embedding,
        metadata: {
          text: chunk,
        },
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in RAG upload route:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
} 