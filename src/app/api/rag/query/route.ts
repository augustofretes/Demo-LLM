import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!indexName) {
      console.error(
        "Error: PINECONE_INDEX_NAME environment variable is not set."
      );
      return NextResponse.json(
        {
          error:
            "Pinecone index configuration error. Please check server logs.",
        },
        { status: 500 }
      );
    }
    const index = pinecone.index(indexName);

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Get query embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    // Search in Pinecone
    const searchResults = await index.query({
      vector: embedding.data[0].embedding,
      topK: 3,
      includeMetadata: true,
    });

    // Prepare context from search results
    const context = searchResults.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (searchResults.matches.length === 0 || !context.trim()) {
      // No relevant context found
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. The user asked a question, but no relevant information was found in the document. Please inform the user of this.",
          },
          {
            role: "user",
            content: `Regarding your question: "${query}"

I could not find relevant information in the uploaded document to provide an answer.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      });
      return NextResponse.json({
        response: completion.choices[0].message.content,
      });
    }

    // Generate response using OpenAI with context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions based on the provided context. If the answer cannot be found in the context, explicitly state that based on the information you have.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${query}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in RAG query route:", error);
    let errorMessage = "Failed to process query. Please check server logs.";
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes("api key")) {
        errorMessage =
          "API configuration error. Please check your API keys and server logs.";
      } else if (
        error.message.toLowerCase().includes("index") &&
        (error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("does not exist"))
      ) {
        errorMessage =
          "Pinecone index not found. Please ensure a document has been successfully uploaded and processed.";
      } else if (
        error.message.toLowerCase().includes("dimensionality mismatch")
      ) {
        errorMessage =
          "There was a technical issue with the document embeddings. Try re-uploading the document.";
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
