import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Function to ensure index exists
async function ensureIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME!;
  
  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some((index) => index.name === indexName) ?? false;

    if (!indexExists) {
      // Create index if it doesn't exist
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI ada-002 embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });
      
      // Wait for index to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return pinecone.index(indexName);
  } catch (error) {
    console.error('Error ensuring index exists:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    let text: string;
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = await pdf(Buffer.from(arrayBuffer));
      text = pdfData.text;
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { message: 'File is empty' },
        { status: 400 }
      );
    }

    // Create text splitter with appropriate chunk size
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Split text into chunks
    const chunks = await textSplitter.splitText(text);

    if (chunks.length === 0) {
      return NextResponse.json(
        { message: 'No valid content found in file' },
        { status: 400 }
      );
    }

    // Ensure index exists and get reference
    const index = await ensureIndex();

    // Process each chunk
    for (const chunk of chunks) {
      try {
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
      } catch (chunkError) {
        console.error('Error processing chunk:', chunkError);
        return NextResponse.json(
          { message: 'Error processing document content' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in RAG upload route:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { message: 'API configuration error' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Failed to process document' },
      { status: 500 }
    );
  }
} 