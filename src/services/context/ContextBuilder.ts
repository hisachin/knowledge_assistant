import { RerankedChunk } from '@/services/reranking/HuggingFaceReranker';

export interface QualityFilteredChunk extends RerankedChunk {
  qualityScore: number;
}

export class ContextBuilder {
  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly MIN_CONTENT_LENGTH = 30;
  private readonly MAX_TOKENS = 3000;
  
  filterChunksByQuality(chunks: RerankedChunk[]): QualityFilteredChunk[] {
    return chunks
      .filter(chunk => 
        chunk.similarity > this.SIMILARITY_THRESHOLD && 
        chunk.content.length > this.MIN_CONTENT_LENGTH
      )
      .map(chunk => ({
        ...chunk,
        qualityScore: this.calculateQualityScore(chunk)
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);
  }
  
  private calculateQualityScore(chunk: RerankedChunk): number {
    const similarityWeight = 0.6;
    const rerankWeight = 0.4;
    
    return (chunk.similarity * similarityWeight) + (chunk.rerankScore * rerankWeight);
  }
  
  buildContextString(chunks: QualityFilteredChunk[]): string {
    if (chunks.length === 0) {
      return 'No relevant content found.';
    }
    
    const contextParts = chunks.map((chunk, index) => {
      return `[Document ${index + 1}]\n[Title: ${chunk.sourceTitle || 'Untitled'}]\n[URL: ${chunk.sourceUrl}]\n[Relevance: ${chunk.similarity.toFixed(3)}]\n[Rerank Score: ${chunk.rerankScore.toFixed(3)}]\n\n${chunk.content}`;
    });
    
    return contextParts.join('\n---\n');
  }
  
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
  
  truncateContext(chunks: QualityFilteredChunk[], maxTokens: number): QualityFilteredChunk[] {
    let currentTokens = 0;
    const selectedChunks: QualityFilteredChunk[] = [];
    
    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.content);
      
      if (currentTokens + chunkTokens <= maxTokens) {
        selectedChunks.push(chunk);
        currentTokens += chunkTokens;
      } else {
        break;
      }
    }
    
    return selectedChunks;
  }
  
  buildFinalContext(chunks: QualityFilteredChunk[]): string {
    let contextString = this.buildContextString(chunks);
    const estimatedTokens = this.estimateTokens(contextString);
    
    if (estimatedTokens > this.MAX_TOKENS) {
      const truncatedChunks = this.truncateContext(chunks, this.MAX_TOKENS);
      contextString = this.buildContextString(truncatedChunks);
      
      contextString += '\n\n[Note: Content truncated due to length limits]';
    }
    
    return contextString;
  }
}
