import { NextResponse } from 'next/server';
import { PostgresSourceRepository } from '@/services/repositories/PostgresSourceRepository';
import { PostgresChunkRepository } from '@/services/repositories/PostgresChunkRepository';
import { db } from '@/lib/db/db';

export async function GET() {
  try {
    const sourceRepository = new PostgresSourceRepository(db);
    const chunkRepository = new PostgresChunkRepository(db);

    const sources = await sourceRepository.findAll();

    const enrichedSources = await Promise.all(
      sources.map(async (source) => {
        const chunks = await chunkRepository.findBySourceId(source.id!);
        const chunkCount = chunks.length;
        const contentLength = chunks.reduce((total, chunk) => total + chunk.content.length, 0);

        return {
          ...source,
          chunkCount,
          contentLength,
        };
      })
    );

    return NextResponse.json({
      success: true,
      sources: enrichedSources,
    });

  } catch (error) {
    console.error('Error fetching sources:', error);
    
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
