import { IChunkingService, TextChunk, ChunkingOptions } from '@/types';
import { CHUNKING_CONFIG } from '@/config';

export class ChunkingService implements IChunkingService {
  private defaultOptions: Required<ChunkingOptions> = {
    maxChunkSize: CHUNKING_CONFIG.defaultChunkSize,
    overlapSize: CHUNKING_CONFIG.defaultOverlap,
    preserveParagraphs: true,
    preserveSentences: true,
  };

  async chunkText(text: string, options?: ChunkingOptions): Promise<TextChunk[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    this.validateOptions(opts);
    
    const cleanedText = this.cleanText(text);
    
    if (opts.preserveParagraphs && opts.preserveSentences) {
      return this.chunkWithParagraphAndSentenceAwareness(cleanedText, opts);
    } else if (opts.preserveParagraphs) {
      return this.chunkWithParagraphAwareness(cleanedText, opts);
    } else {
      return this.chunkWithFixedSize(cleanedText, opts);
    }
  }

  getOptimalChunkSize(): number {
    return CHUNKING_CONFIG.defaultChunkSize;
  }

  private validateOptions(options: Required<ChunkingOptions>): void {
    if (options.maxChunkSize < CHUNKING_CONFIG.minChunkSize) {
      throw new Error(`Chunk size must be at least ${CHUNKING_CONFIG.minChunkSize} characters`);
    }
    
    if (options.maxChunkSize > CHUNKING_CONFIG.maxChunkSize) {
      throw new Error(`Chunk size must not exceed ${CHUNKING_CONFIG.maxChunkSize} characters`);
    }
    
    if (options.overlapSize >= options.maxChunkSize) {
      throw new Error('Overlap size must be smaller than chunk size');
    }
    
    if (options.overlapSize < 0) {
      throw new Error('Overlap size must be non-negative');
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private chunkWithParagraphAndSentenceAwareness(text: string, options: Required<ChunkingOptions>): TextChunk[] {
    const chunks: TextChunk[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      if (currentChunk.length + paragraph.length > options.maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          startPosition,
          endPosition: startPosition + currentChunk.length,
          metadata: {
            paragraphIndex: i - 1,
          },
        });
        
        const overlapText = this.getOverlapText(currentChunk, options.overlapSize);
        currentChunk = overlapText + '\n\n' + paragraph;
        startPosition = startPosition + currentChunk.length - paragraph.length - overlapText.length - 2;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        startPosition,
        endPosition: startPosition + currentChunk.length,
        metadata: {
          paragraphIndex: paragraphs.length - 1,
        },
      });
    }
    
    return chunks;
  }

  private chunkWithParagraphAwareness(text: string, options: Required<ChunkingOptions>): TextChunk[] {
    const chunks: TextChunk[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      if (currentChunk.length + paragraph.length > options.maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          startPosition,
          endPosition: startPosition + currentChunk.length,
          metadata: { paragraphIndex: i - 1 },
        });
        
        currentChunk = paragraph;
        startPosition = startPosition + currentChunk.length - paragraph.length;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        startPosition,
        endPosition: startPosition + currentChunk.length,
        metadata: { paragraphIndex: paragraphs.length - 1 },
      });
    }
    
    return chunks;
  }

  private chunkWithFixedSize(text: string, options: Required<ChunkingOptions>): TextChunk[] {
    const chunks: TextChunk[] = [];
    const effectiveChunkSize = options.maxChunkSize - options.overlapSize;
    
    for (let i = 0; i < text.length; i += effectiveChunkSize) {
      const start = i;
      const end = Math.min(i + options.maxChunkSize, text.length);
      
      chunks.push({
        content: text.substring(start, end).trim(),
        index: chunks.length,
        startPosition: start,
        endPosition: end,
      });
    }
    
    return chunks;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize <= 0) return '';
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let overlapText = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (overlapText.length + sentence.length <= overlapSize) {
        overlapText = sentence + (overlapText ? '. ' : '') + overlapText;
      } else {
        break;
      }
    }
    
    if (overlapText.length === 0) {
      overlapText = text.slice(-overlapSize);
    }
    
    return overlapText;
  }
}
