import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const perplexityClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemMessage = {
      role: "system",
      content: "You are an artificial intelligence assistant and you need to engage in a helpful, detailed, polite conversation with a user. Use markdown headers (## for main sections and ### for subsections) to structure your responses with clear titles. Make sure to use headers for important sections of your response.",
    };

    const response = await perplexityClient.chat.completions.create({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [systemMessage, ...messages],
      stream: true,
      max_tokens: 1000,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
