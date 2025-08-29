import { NextRequest, NextResponse } from 'next/server';
import { PostgresSourceRepository } from '@/services/repositories/PostgresSourceRepository';
import { PostgresChunkRepository } from '@/services/repositories/PostgresChunkRepository';
import { db } from '@/lib/db/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sourceId = parseInt(id);
    
    if (isNaN(sourceId)) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    const sourceRepository = new PostgresSourceRepository(db);
    const chunkRepository = new PostgresChunkRepository(db);

    const source = await sourceRepository.findById(sourceId);
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    await chunkRepository.deleteBySourceId(sourceId);
    
    const deleted = await sourceRepository.delete(sourceId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete source' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting source:', error);
    
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
