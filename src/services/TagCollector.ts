import { App, TFile, CachedMetadata } from 'obsidian';

export interface TagInfo {
  tag: string;
  frequency: number;
}

export class TagCollector {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Collect all unique tags from the vault
   */
  async collectAllTags(): Promise<string[]> {
    const tagSet = new Set<string>();

    // Get all markdown files in the vault
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const tags = this.extractTagsFromFile(file);
      tags.forEach((tag) => tagSet.add(tag));
    }

    // Return sorted unique tags
    return Array.from(tagSet).sort();
  }

  /**
   * Get tag frequency across the vault
   */
  async getTagFrequency(): Promise<Map<string, number>> {
    const frequencyMap = new Map<string, number>();

    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const tags = this.extractTagsFromFile(file);
      tags.forEach((tag) => {
        frequencyMap.set(tag, (frequencyMap.get(tag) || 0) + 1);
      });
    }

    return frequencyMap;
  }

  /**
   * Extract tags from a specific file (frontmatter + content)
   */
  private extractTagsFromFile(file: TFile): string[] {
    const tags = new Set<string>();

    // Get cached metadata for the file
    const metadata = this.app.metadataCache.getFileCache(file);

    if (metadata) {
      // Extract tags from frontmatter
      if (metadata.frontmatter && metadata.frontmatter.tags) {
        const frontmatterTags = metadata.frontmatter.tags;
        if (typeof frontmatterTags === 'string') {
          // Tags might be a comma-separated string or a single tag
          frontmatterTags.split(',').forEach((tag) => {
            let trimmedTag = tag.trim();
            // Remove # prefix if present
            if (trimmedTag.startsWith('#')) {
              trimmedTag = trimmedTag.substring(1);
            }
            if (trimmedTag) {
              tags.add(trimmedTag);
            }
          });
        } else if (Array.isArray(frontmatterTags)) {
          frontmatterTags.forEach((tag) => {
            if (typeof tag === 'string') {
              let trimmedTag = tag.trim();
              // Remove # prefix if present
              if (trimmedTag.startsWith('#')) {
                trimmedTag = trimmedTag.substring(1);
              }
              if (trimmedTag) {
                tags.add(trimmedTag);
              }
            }
          });
        }
      }

      // Extract tags from content (inline tags)
      if (metadata.tags) {
        metadata.tags.forEach((tagRef) => {
          // tagRef.tag includes the # prefix, so we need to remove it
          const tag = tagRef.tag.startsWith('#')
            ? tagRef.tag.substring(1)
            : tagRef.tag;
          if (tag) {
            tags.add(tag);
          }
        });
      }
    }

    return Array.from(tags);
  }
}
