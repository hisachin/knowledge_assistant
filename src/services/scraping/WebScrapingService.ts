import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScrapingService, ScrapedContent } from '@/types';

export class WebScrapingService implements IScrapingService {
  private readonly userAgent = 'Mozilla/5.0 (compatible; ChatbotKB/1.0; +https://github.com/your-repo)';
  private readonly timeout = 30000;

  async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.timeout,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch URL`);
      }

      const html = response.data as string;
      const $ = cheerio.load(html);

      const title = this.extractTitle($);
      const description = this.extractDescription($);
      const content = this.extractMainContent($);

      const wordCount = this.calculateWordCount(content);

      return {
        url,
        title,
        description,
        content,
        metadata: {
          wordCount,
          language: this.detectLanguage($),
          author: this.extractAuthor($),
          publishedDate: this.extractPublishedDate($),
        },
      };

    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error && error.response) {
        const axiosError = error as { response: { status: number }; code?: string };
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout - the website took too long to respond');
        } else if (axiosError.response.status === 403) {
          throw new Error('Access denied - the website blocked our request');
        } else if (axiosError.response.status === 404) {
          throw new Error('Page not found - the URL does not exist');
        } else if (axiosError.response.status >= 500) {
          throw new Error('Server error - the website is experiencing issues');
        }
        throw new Error(`Failed to fetch URL: Unknown error`);
      }
      throw new Error(`Scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  getSupportedDomains(): string[] {
    return ['*'];
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('h1').first().text().trim() ||
                  'Untitled';

    return title.length > 200 ? title.substring(0, 200) + '...' : title;
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       '';

    return description.length > 300 ? description.substring(0, 300) + '...' : description;
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    $('script, style, nav, header, footer, aside, .sidebar, .navigation, .menu').remove();
    $('noscript, .ads, .advertisement, .banner').remove();

    let content = $('main, article, .content, .post, .entry, #content, #main').text();
    
    if (!content || content.trim().length < 100) {
      content = $('body').text();
    }

    return this.cleanText(content);
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private detectLanguage($: cheerio.CheerioAPI): string {
    return $('html').attr('lang') || 'en';
  }

  private extractAuthor($: cheerio.CheerioAPI): string {
    return $('meta[name="author"]').attr('content') ||
           $('meta[property="article:author"]').attr('content') ||
           $('.author, .byline').text().trim() ||
           '';
  }

  private extractPublishedDate($: cheerio.CheerioAPI): string {
    return $('meta[property="article:published_time"]').attr('content') ||
           $('meta[name="publish_date"]').attr('content') ||
           $('time[datetime]').attr('datetime') ||
           '';
  }
}
