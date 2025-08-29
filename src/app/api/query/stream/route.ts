import { NextRequest } from 'next/server';
import { EmbeddingServiceFactory } from '@/services/embedding/EmbeddingServiceFactory';
import { PostgresChunkRepository } from '@/services/repositories/PostgresChunkRepository';
import { LLMServiceFactory } from '@/services/llm/LLMServiceFactory';
import { ContextBuilder } from '@/services/context/ContextBuilder';
import { HuggingFaceReranker } from '@/services/reranking/HuggingFaceReranker';
import { db } from '@/lib/db/db';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        `data: ${JSON.stringify({ error: 'Query is required and must be a string' })}\n\n`,
        { status: 400 }
      );
    }

    if (query.trim().length < 3) {
      return new Response(
        `data: ${JSON.stringify({ error: 'Query must be at least 3 characters long' })}\n\n`,
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Processing query...' })}\n\n`));

          const embeddingService = EmbeddingServiceFactory.createFromEnv();
          const chunkRepository = new PostgresChunkRepository(db);
          const llmService = LLMServiceFactory.createStreamingFromEnv();
          const contextBuilder = new ContextBuilder();
          const reranker = new HuggingFaceReranker();

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating embeddings...' })}\n\n`));
          const queryEmbedding = await embeddingService.generateEmbedding(query);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generated query embedding with ' + queryEmbedding.length + ' dimensions' })}\n\n`));

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Searching knowledge base...' })}\n\n`));
          const similarChunks = await chunkRepository.findSimilar(queryEmbedding, 3);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Found ' + similarChunks.length + ' relevant chunks' })}\n\n`));

          if (similarChunks.length === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              data: {
                query,
                answer: 'I don\'t have enough information to answer your question based on the available documentation.',
                sources: [],
                chunksUsed: 0,
              }
            })}\n\n`));
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Reranking chunks for relevance...' })}\n\n`));
          const rerankedChunks = await reranker.rerankChunks(queryEmbedding, similarChunks);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Building context...' })}\n\n`));
          const qualityFilteredChunks = contextBuilder.filterChunksByQuality(rerankedChunks);
          const context = contextBuilder.buildFinalContext(qualityFilteredChunks);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Context built with ' + qualityFilteredChunks.length + ' chunks' })}\n\n`));

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating answer with AI...' })}\n\n`));
          
          const streamingResponse = llmService.generateStreamingAnswer(query, context);
          const reader = streamingResponse.getReader();
          
          let fullAnswer = '';
          const sources = qualityFilteredChunks.map(chunk => ({
            title: chunk.sourceTitle || 'Untitled',
            url: chunk.sourceUrl,
          }));

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'partial' && data.data && data.data.answer) {
                      fullAnswer = data.data.answer;
                      
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'partial', 
                        data: {
                          query,
                          answer: fullAnswer,
                          sources,
                          chunksUsed: qualityFilteredChunks.length,
                          isComplete: false,
                        }
                      })}\n\n`));
                    }
                  } catch {
                    continue;
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            data: {
              query,
              answer: fullAnswer,
              sources,
              chunksUsed: qualityFilteredChunks.length,
            }
          })}\n\n`));
          
        } catch (error) {
          console.error('Streaming error:', error);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error occurred' 
            })}\n\n`));
          } catch (enqueueError) {
            console.warn('Failed to enqueue error message:', enqueueError);
          }
        } finally {
          try {
            controller.close();
          } catch (closeError) {
            console.warn('Error closing controller:', closeError);
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Query stream error:', error);
    return new Response(
      `data: ${JSON.stringify({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })}\n\n`,
      { 
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  }
}
