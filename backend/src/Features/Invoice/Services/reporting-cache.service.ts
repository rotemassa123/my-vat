import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ReportingQueryRequest } from '../Requests/reporting.requests';
import { UserContext } from './reporting-query-builder.service';
import { UserType } from 'src/Common/consts/userType';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  accountId: string;
  entityId?: string;
}

@Injectable()
export class ReportingCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  generateCacheKey(user: UserContext, params: ReportingQueryRequest): string {
    const baseKey = `reporting:${user.accountId}`;
    
    // Add entity restriction for members/guests
    const entityKey = user.userType === UserType.member || user.userType === UserType.viewer 
      ? `:${user.entityId}` 
      : ':all'; // Admins see all entities in account
    
    // Create hash of query parameters for consistent keys
    const queryHash = this.hashObject({
      ...params,
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'desc'
    });
    
    return `${baseKey}${entityKey}:${queryHash}`;
  }

  get(cacheKey: string): unknown | null {
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  set(cacheKey: string, data: unknown, user: UserContext): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      accountId: user.accountId,
      entityId: user.entityId,
    });
  }

  invalidateUserCache(accountId: string, entityId?: string): void {
    for (const [key, entry] of this.cache) {
      if (entry.accountId === accountId) {
        // If entityId specified, only invalidate that entity's cache
        if (entityId && entry.entityId && entry.entityId !== entityId) {
          continue;
        }
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }



  private hashObject(obj: Record<string, unknown>): string {
    const sortedObj = this.sortObjectKeys(obj);
    const jsonString = JSON.stringify(sortedObj);
    return createHash('md5').update(jsonString).digest('hex').substring(0, 12);
  }

  private sortObjectKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const sortedObj: Record<string, unknown> = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    
    return sortedObj;
  }
} 