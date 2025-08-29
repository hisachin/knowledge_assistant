import { NextRequest, NextResponse } from 'next/server';
import { WebScrapingService } from '@/services/scraping/WebScrapingService';
import { ChunkingService } from '@/services/chunking/ChunkingService';
import { EmbeddingServiceFactory } from '@/services/embedding/EmbeddingServiceFactory';
import { PostgresSourceRepository } from '@/services/repositories/PostgresSourceRepository';
import { PostgresChunkRepository } from '@/services/repositories/PostgresChunkRepository';
import { db } from '@/lib/db/db';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    const scrapingService = new WebScrapingService();
    const chunkingService = new ChunkingService();
    const embeddingService = EmbeddingServiceFactory.createFromEnv();
    const sourceRepository = new PostgresSourceRepository(db);
    const chunkRepository = new PostgresChunkRepository(db);

    const scrapedContent = await scrapingService.scrapeUrl(url);

    let source;
    const existingSource = await sourceRepository.findByUrl(url);
    
    if (existingSource) {
      await chunkRepository.deleteBySourceId(existingSource.id!);
      
      source = await sourceRepository.update(existingSource.id!, {
        title: scrapedContent.title,
        description: scrapedContent.description,
      });
    } else {
      source = await sourceRepository.create({
        url: scrapedContent.url,
        title: scrapedContent.title,
        description: scrapedContent.description,
      });
    }
    
    if (!source || !source.id) {
      throw new Error('Failed to create or update source record');
    }

    const chunks = await chunkingService.chunkText(scrapedContent.content);

    const chunkPromises = chunks.map(async (chunk, index) => {
      const embedding = await embeddingService.generateEmbedding(chunk.content);
      
      return chunkRepository.create({
        sourceId: source.id!,
        content: chunk.content,
        embedding,
        chunkIndex: index,
      });
    });

    await Promise.all(chunkPromises);

    const isUpdate = !!existingSource;
    
    return NextResponse.json({
      success: true,
      message: isUpdate ? 'URL content updated successfully' : 'URL successfully ingested',
      data: {
        sourceId: source.id,
        chunksCount: chunks.length,
        title: source.title,
        isUpdate,
      },
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    
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
