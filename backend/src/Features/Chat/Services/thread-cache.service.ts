import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai-assistant.service';

interface ThreadCacheEntry {
  threadId: string;
  lastUsed: Date;
  isFirstMessage: boolean;
}

@Injectable()
export class ThreadCacheService {
  private cache: Map<string, ThreadCacheEntry> = new Map();
  private openaiService: OpenAIService;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    openaiService: OpenAIService
  ) {
    this.openaiService = openaiService;
    
    // Cleanup expired threads every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredThreads();
    }, 5 * 60 * 1000);
  }

  async getUserThread(userId: string): Promise<string> {
    const now = new Date();
    
    // Check if thread exists and is not expired
    const cached = this.cache.get(userId);
    if (cached && this.isThreadValid(cached, now)) {
      // Update last used time
      cached.lastUsed = now;
      return cached.threadId;
    }
    
    // Create new thread
    const threadId = await this.openaiService.createThread();
    this.cache.set(userId, {
      threadId,
      lastUsed: now,
      isFirstMessage: true
    });
    
    return threadId;
  }

  isFirstMessage(userId: string): boolean {
    const cached = this.cache.get(userId);
    return cached ? cached.isFirstMessage : false;
  }

  markFirstMessageComplete(userId: string): void {
    const cached = this.cache.get(userId);
    if (cached) {
      cached.isFirstMessage = false;
    }
  }

  private isThreadValid(cached: ThreadCacheEntry, now: Date): boolean {
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return (now.getTime() - cached.lastUsed.getTime()) < oneHour;
  }

  private cleanupExpiredThreads(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (!this.isThreadValid(cached, now)) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired threads
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired chat threads`);
    }
  }

  // Optional: Manual cleanup method
  async cleanupUserThread(userId: string): Promise<void> {
    this.cache.delete(userId);
  }

  // Optional: Get active thread count
  getActiveThreadCount(): number {
    return this.cache.size;
  }

  // Cleanup on service destruction
  onDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
