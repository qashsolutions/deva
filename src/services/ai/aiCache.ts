import AsyncStorage from '@react-native-async-storage/async-storage';
import aiConfig from '../../config/ai';
import { CacheEntry, CacheStats } from '../../types/ai';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
}

class AICache {
  private readonly prefix = 'ai_cache_';
  private readonly metaKey = 'ai_cache_meta';
  
  async get(key: string): Promise<any | null> {
    try {
      const entryKey = this.prefix + key;
      const entryStr = await AsyncStorage.getItem(entryKey);
      
      if (!entryStr) return null;
      
      const entry: CacheEntry = JSON.parse(entryStr);
      
      // Check if expired
      if (new Date(entry.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }
      
      // Update hit count
      entry.hitCount++;
      await AsyncStorage.setItem(entryKey, JSON.stringify(entry));
      
      return entry.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || aiConfig.caching.ttl;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
      
      const entry: CacheEntry = {
        key,
        value,
        expiresAt,
        hitCount: 0,
        size: this.getSize(value),
        tags: options.tags,
      };
      
      // Check cache size limits
      const stats = await this.getStats();
      if (stats.totalEntries >= aiConfig.caching.maxEntries) {
        await this.evictOldest();
      }
      
      if ((stats.totalSize + entry.size) > aiConfig.caching.maxCacheSize * 1024 * 1024) {
        await this.evictLeastUsed();
      }
      
      await AsyncStorage.setItem(this.prefix + key, JSON.stringify(entry));
      await this.updateMeta(key, entry);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
      await this.removeMeta(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
      await AsyncStorage.removeItem(this.metaKey);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  async getStats(): Promise<CacheStats> {
    try {
      const meta = await this.getMeta();
      const entries = Object.values(meta);
      
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0) / (1024 * 1024); // MB
      const hitRate = entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.hitCount, 0) / entries.length
        : 0;
      
      const oldestEntry = entries.length > 0
        ? entries.reduce((oldest, entry) => 
            new Date(entry.expiresAt) < new Date(oldest.expiresAt) ? entry : oldest
          ).key
        : '';
      
      const mostAccessed = entries
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 5)
        .map(e => e.key);
      
      return {
        totalEntries: entries.length,
        totalSize,
        hitRate,
        oldestEntry,
        mostAccessed,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        oldestEntry: '',
        mostAccessed: [],
      };
    }
  }
  
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const meta = await this.getMeta();
      const keysToInvalidate: string[] = [];
      
      Object.entries(meta).forEach(([key, entry]) => {
        if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
          keysToInvalidate.push(key);
        }
      });
      
      await Promise.all(keysToInvalidate.map(key => this.delete(key)));
    } catch (error) {
      console.error('Cache invalidate by tags error:', error);
    }
  }
  
  private async getMeta(): Promise<Record<string, CacheEntry>> {
    try {
      const metaStr = await AsyncStorage.getItem(this.metaKey);
      return metaStr ? JSON.parse(metaStr) : {};
    } catch (error) {
      console.error('Get meta error:', error);
      return {};
    }
  }
  
  private async updateMeta(key: string, entry: CacheEntry): Promise<void> {
    try {
      const meta = await this.getMeta();
      meta[key] = entry;
      await AsyncStorage.setItem(this.metaKey, JSON.stringify(meta));
    } catch (error) {
      console.error('Update meta error:', error);
    }
  }
  
  private async removeMeta(key: string): Promise<void> {
    try {
      const meta = await this.getMeta();
      delete meta[key];
      await AsyncStorage.setItem(this.metaKey, JSON.stringify(meta));
    } catch (error) {
      console.error('Remove meta error:', error);
    }
  }
  
  private async evictOldest(): Promise<void> {
    try {
      const meta = await this.getMeta();
      const entries = Object.entries(meta);
      
      if (entries.length === 0) return;
      
      const oldest = entries.reduce((oldest, [key, entry]) => 
        new Date(entry.expiresAt) < new Date(oldest[1].expiresAt) ? [key, entry] : oldest
      );
      
      await this.delete(oldest[0]);
    } catch (error) {
      console.error('Evict oldest error:', error);
    }
  }
  
  private async evictLeastUsed(): Promise<void> {
    try {
      const meta = await this.getMeta();
      const entries = Object.entries(meta);
      
      if (entries.length === 0) return;
      
      const leastUsed = entries.reduce((least, [key, entry]) => 
        entry.hitCount < least[1].hitCount ? [key, entry] : least
      );
      
      await this.delete(leastUsed[0]);
    } catch (error) {
      console.error('Evict least used error:', error);
    }
  }
  
  private getSize(value: any): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }
  
  // Cleanup expired entries periodically
  async cleanupExpired(): Promise<void> {
    try {
      const meta = await this.getMeta();
      const now = new Date();
      const expiredKeys: string[] = [];
      
      Object.entries(meta).forEach(([key, entry]) => {
        if (new Date(entry.expiresAt) < now) {
          expiredKeys.push(key);
        }
      });
      
      await Promise.all(expiredKeys.map(key => this.delete(key)));
    } catch (error) {
      console.error('Cleanup expired error:', error);
    }
  }
}

export const aiCache = new AICache();

// Set up periodic cleanup
setInterval(() => {
  aiCache.cleanupExpired();
}, 5 * 60 * 1000); // Every 5 minutes