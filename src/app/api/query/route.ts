import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingServiceFactory } from '@/services/embedding/EmbeddingServiceFactory';
import { PostgresChunkRepository } from '@/services/repositories/PostgresChunkRepository';
import { SimpleAnswerGenerator } from '@/services/llm/SimpleAnswerGenerator';
import { db } from '@/lib/db/db';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      );
    }

    const embeddingService = EmbeddingServiceFactory.createFromEnv();
    const chunkRepository = new PostgresChunkRepository(db);
    const answerGenerator = new SimpleAnswerGenerator();

    const queryEmbedding = await embeddingService.generateEmbedding(query);
    console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);

    const similarChunks = await chunkRepository.findSimilar(queryEmbedding, 5);
    console.log(`Raw similarity search returned ${similarChunks.length} chunks`);
    
    if (similarChunks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No relevant content found',
        data: {
          query,
          answer: 'I don\'t know based on the documentation.',
          sources: [],
        },
      });
    }

    const generatedAnswer = answerGenerator.generateAnswer(query, similarChunks);
    console.log(`Generated answer with ${generatedAnswer.sources.length} sources`);

    return NextResponse.json({
      success: true,
      message: 'Answer generated successfully',
      data: {
        query,
        answer: generatedAnswer.answer,
        sources: generatedAnswer.sources,
        chunksUsed: similarChunks.length,
      },
    });

  } catch (error) {
    console.error('Query error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}
