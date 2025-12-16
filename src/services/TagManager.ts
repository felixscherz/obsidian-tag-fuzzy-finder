import { App } from 'obsidian';
import { TagCollector } from './TagCollector';

export class TagManager {
  private app: App;
  private tagCollector: TagCollector;
  private cachedTags: string[] | null = null;
  private tagFrequency: Map<string, number> | null = null;
  private lastCollectionTime: number = 0;
  private collectionDebounceTime: number = 500; // ms
  private isCollecting: boolean = false;

  constructor(app: App) {
    this.app = app;
    this.tagCollector = new TagCollector(app);

    // Listen to vault changes to invalidate cache
    this.app.vault.on('create', () => this.invalidateCache());
    this.app.vault.on('delete', () => this.invalidateCache());
    this.app.vault.on('modify', () => this.invalidateCache());
    this.app.metadataCache.on('resolved', () => this.invalidateCache());
  }

  /**
   * Get all tags from the vault (with caching)
   */
  async getTags(): Promise<string[]> {
    if (this.cachedTags !== null) {
      return this.cachedTags;
    }

    await this.ensureTagsCollected();
    return this.cachedTags || [];
  }

  /**
   * Get tag frequency map
   */
  async getTagFrequency(): Promise<Map<string, number>> {
    if (this.tagFrequency !== null) {
      return this.tagFrequency;
    }

    await this.ensureTagsCollected();
    return this.tagFrequency || new Map();
  }

  /**
   * Invalidate the cache
   */
  private invalidateCache(): void {
    // Debounce cache invalidation to avoid too frequent collections
    const now = Date.now();
    if (now - this.lastCollectionTime < this.collectionDebounceTime) {
      return;
    }

    this.cachedTags = null;
    this.tagFrequency = null;
  }

  /**
   * Ensure tags are collected (debounced)
   */
  private async ensureTagsCollected(): Promise<void> {
    if (this.isCollecting) {
      // Already collecting, wait a bit and return
      return;
    }

    if (this.cachedTags !== null) {
      return;
    }

    this.isCollecting = true;
    try {
      this.cachedTags = await this.tagCollector.collectAllTags();
      this.tagFrequency = await this.tagCollector.getTagFrequency();
      this.lastCollectionTime = Date.now();
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Force refresh of tags
   */
  async refreshTags(): Promise<void> {
    this.cachedTags = null;
    this.tagFrequency = null;
    await this.ensureTagsCollected();
  }
}
