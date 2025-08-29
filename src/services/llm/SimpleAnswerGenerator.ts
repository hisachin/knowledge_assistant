import { ChunkWithSimilarity } from '@/types';

export interface GeneratedAnswer {
  answer: string;
  sources: Array<{ title: string; url: string }>;
}

export class SimpleAnswerGenerator {
  generateAnswer(query: string, chunks: ChunkWithSimilarity[]): GeneratedAnswer {
    if (chunks.length === 0) {
      return {
        answer: 'I don\'t know based on the documentation.',
        sources: [],
      };
    }

    const sortedChunks = chunks.sort((a, b) => b.similarity - a.similarity);
    
    const topChunk = sortedChunks[0];
    
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const relevantContent = this.extractRelevantContent(topChunk.content, queryKeywords);
    
    const answer = this.formatAnswer(query, relevantContent, topChunk.sourceTitle || 'Untitled');
    
    const sources = sortedChunks
      .filter(chunk => chunk.similarity > 0.1)
      .map(chunk => ({
        title: chunk.sourceTitle || 'Untitled',
        url: chunk.sourceUrl,
      }));

    return {
      answer,
      sources,
    };
  }

  private extractKeywords(query: string): string[] {
    const commonWords = ['what', 'how', 'when', 'where', 'why', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return query
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  }

  private extractRelevantContent(content: string, keywords: string[]): string {
    if (keywords.length === 0) {
      return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const relevantSentences: string[] = [];

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const keywordCount = keywords.filter(keyword => sentenceLower.includes(keyword)).length;
      
      if (keywordCount > 0) {
        relevantSentences.push(sentence.trim());
      }
    }

    if (relevantSentences.length === 0) {
      return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }

    let result = relevantSentences.join('. ');
    if (result.length > 300) {
      result = result.substring(0, 300) + '...';
    }

    return result;
  }

  private formatAnswer(query: string, content: string, sourceTitle: string): string {
    const questionType = this.getQuestionType(query);
    
    switch (questionType) {
      case 'what':
        return `Based on the documentation, ${content}`;
      case 'how':
        return `To accomplish this, ${content}`;
      case 'where':
        return `According to the documentation, ${content}`;
      case 'when':
        return `The documentation indicates that ${content}`;
      default:
        return `${content}`;
    }
  }

  private getQuestionType(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.startsWith('what')) return 'what';
    if (lowerQuery.startsWith('how')) return 'how';
    if (lowerQuery.startsWith('where')) return 'where';
    if (lowerQuery.startsWith('when')) return 'when';
    if (lowerQuery.startsWith('why')) return 'why';
    return 'general';
  }
}
