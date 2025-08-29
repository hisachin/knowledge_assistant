import { IChunkRepository, Chunk, ChunkWithSimilarity } from '@/types';
import { DatabaseConnection } from '@/lib/db/db';

export class PostgresChunkRepository implements IChunkRepository {
  constructor(private db: DatabaseConnection) {}

  async create(chunk: Chunk): Promise<Chunk> {
    const query = `
      INSERT INTO chunks (source_id, content, embedding, chunk_index, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, source_id, content, embedding, chunk_index, created_at
    `;
    
    const params = [
      chunk.sourceId,
      chunk.content,
      chunk.embedding ? `[${chunk.embedding.join(',')}]` : null,
      chunk.chunkIndex,
      chunk.createdAt || new Date(),
    ];

    const result = await this.db.queryOne<Chunk>(query, params);
    if (!result) {
      throw new Error('Failed to create chunk');
    }

    return {
      ...result,
      embedding: result.embedding ? this.parseEmbedding(result.embedding as unknown) : undefined,
      createdAt: new Date(result.createdAt as string | Date),
    };
  }

  async findById(id: number): Promise<Chunk | null> {
    const query = `
      SELECT id, source_id, content, embedding, chunk_index, created_at
      FROM chunks
      WHERE id = $1
    `;
    
    const result = await this.db.queryOne<Chunk>(query, [id]);
    if (!result) return null;

    return {
      ...result,
      embedding: result.embedding ? this.parseEmbedding(result.embedding as unknown) : undefined,
      createdAt: new Date(result.createdAt as string | Date),
    };
  }

  async findBySourceId(sourceId: number): Promise<Chunk[]> {
    const query = `
      SELECT id, source_id, content, embedding, chunk_index, created_at
      FROM chunks
      WHERE source_id = $1
      ORDER BY chunk_index
    `;
    
    const results = await this.db.query<Chunk>(query, [sourceId]);
    
    return results.map(result => ({
      ...result,
      embedding: result.embedding ? this.parseEmbedding(result.embedding as unknown) : undefined,
      createdAt: new Date(result.createdAt as string | Date),
    }));
  }

  async findSimilar(embedding: number[], limit: number = 5): Promise<ChunkWithSimilarity[]> {
    if (!embedding || embedding.length === 0) {
      throw new Error('Embedding vector is required for similarity search');
    }

    const vectorString = `[${embedding.join(',')}]`;
    
    const chunksQuery = `
      SELECT 
        id,
        source_id,
        LEFT(content, 100) as content_preview,
        1 - (embedding <=> '${vectorString}'::vector) as similarity
      FROM chunks 
      WHERE embedding IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit * 2}
    `;
    
    const chunksResults = await this.db.query(chunksQuery, []);
    
    if (chunksResults.length === 0) {
      return [];
    }
    
    const sourceIds = chunksResults.map((r) => (r as { source_id: number }).source_id);
    const sourcesQuery = `
      SELECT id, url, title FROM sources WHERE id = ANY($1)
    `;
    
    const sourcesResults = await this.db.query<{ id: number; url: string; title: string }>(sourcesQuery, [sourceIds]);
    
    const sourceMap = new Map(sourcesResults.map((s) => [s.id, s]));
    
    const sortedResults = chunksResults
      .sort((a, b) => parseFloat((b as { similarity: string }).similarity) - parseFloat((a as { similarity: string }).similarity))
      .slice(0, limit);
    
    const chunkIds = sortedResults.map((r) => (r as { id: number }).id);
    const fullContentQuery = `
      SELECT id, content, chunk_index, created_at
      FROM chunks 
      WHERE id = ANY($1)
    `;
    
    const fullContentResults = await this.db.query<{ id: number; content: string; chunk_index: number; created_at: string }>(fullContentQuery, [chunkIds]);
    const contentMap = new Map(fullContentResults.map((r) => [r.id, r]));
    
    const combinedResults = sortedResults.map((chunk) => {
      const chunkData = chunk as { id: number; source_id: number; content_preview: string; similarity: string };
      const fullContent = contentMap.get(chunkData.id);
      return {
        id: chunkData.id,
        sourceId: chunkData.source_id,
        content: fullContent?.content || chunkData.content_preview,
        embedding: embedding,
        chunkIndex: fullContent?.chunk_index || 0,
        createdAt: fullContent?.created_at ? new Date(fullContent.created_at) : new Date(),
        sourceUrl: sourceMap.get(chunkData.source_id)?.url || '',
        sourceTitle: sourceMap.get(chunkData.source_id)?.title || '',
        similarity: parseFloat(chunkData.similarity),
      };
    });
    
    return combinedResults;
  }

  async update(id: number, chunk: Partial<Chunk>): Promise<Chunk | null> {
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (chunk.content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      params.push(chunk.content);
    }

    if (chunk.embedding !== undefined) {
      updateFields.push(`embedding = $${paramIndex++}`);
      params.push(chunk.embedding ? `[${chunk.embedding.join(',')}]` : null);
    }

    if (chunk.chunkIndex !== undefined) {
      updateFields.push(`chunk_index = $${paramIndex++}`);
      params.push(chunk.chunkIndex);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    const query = `
      UPDATE chunks
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, source_id, content, embedding, chunk_index, created_at
    `;

    const result = await this.db.queryOne<Chunk>(query, params);
    if (!result) return null;

    return {
      ...result,
      embedding: result.embedding ? this.parseEmbedding(result.embedding as unknown) : undefined,
      createdAt: new Date(result.createdAt as string | Date),
    };
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM chunks WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.length > 0;
  }

  async deleteBySourceId(sourceId: number): Promise<boolean> {
    const query = 'DELETE FROM chunks WHERE source_id = $1';
    const result = await this.db.query(query, [sourceId]);
    return result.length > 0;
  }

  async countBySourceId(sourceId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM chunks WHERE source_id = $1';
    const result = await this.db.queryOne<{ count: string }>(query, [sourceId]);
    return result ? parseInt(result.count) : 0;
  }

  private parseEmbedding(embedding: unknown): number[] {
    if (Array.isArray(embedding)) {
      return embedding;
    }
    
    if (typeof embedding === 'string') {
      return embedding
        .replace(/[{}]/g, '')
        .split(',')
        .map(x => parseFloat(x.trim()));
    }
    
    throw new Error('Invalid embedding format');
  }
}
