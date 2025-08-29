import { ChunkWithSimilarity } from '@/types';

export interface RerankedChunk extends ChunkWithSimilarity {
  rerankScore: number;
}

export class HuggingFaceReranker {
  async rerankChunks(queryEmbedding: number[], chunks: ChunkWithSimilarity[]): Promise<RerankedChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    const rerankedChunks: RerankedChunk[] = chunks.map(chunk => {
      let score = chunk.similarity;
      
      const rerankedChunk: RerankedChunk = {
        ...chunk,
        rerankScore: score,
      };
      
      return rerankedChunk;
    });

    return rerankedChunks.sort((a, b) => b.rerankScore - a.rerankScore);
  }
}