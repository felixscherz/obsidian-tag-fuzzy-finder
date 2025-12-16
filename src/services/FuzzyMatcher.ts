export interface SearchResult {
  tag: string;
  score: number;
}

export class FuzzyMatcher {
  private frequencyMap: Map<string, number> = new Map();

  /**
   * Initialize matcher with tag frequency data
   */
  setFrequencyMap(frequencyMap: Map<string, number>): void {
    this.frequencyMap = frequencyMap;
  }

  /**
   * Search for tags matching the query string
   * Returns results sorted by score (highest first)
   */
  search(query: string, tags: string[], limit: number = 50): SearchResult[] {
    if (!query || !tags || tags.length === 0) {
      // Return all tags sorted by frequency if no query
      return tags
        .map((tag) => ({
          tag,
          score: this.frequencyMap.get(tag) || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    const results: SearchResult[] = tags
      .map((tag) => ({
        tag,
        score: this.matchScore(query, tag),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Check if a query matches a tag
   */
  isMatch(query: string, tag: string): boolean {
    return this.matchScore(query, tag) > 0;
  }

  /**
   * Calculate match score for a query against a tag
   * Higher score = better match
   * Scoring rules:
   * - Exact match: 1000 points
   * - Consecutive character matches: high score
   * - Non-consecutive matches: lower score
   * - Bonus for matching at word boundaries
   * - Frequency boost: tag frequency multiplier
   */
  matchScore(query: string, tag: string): number {
    const queryLower = query.toLowerCase();
    const tagLower = tag.toLowerCase();

    // Exact match
    if (queryLower === tagLower) {
      return 1000 + (this.frequencyMap.get(tag) || 0) * 10;
    }

    // Check if all characters of query exist in tag in order
    let queryIndex = 0;
    let tagIndex = 0;
    let consecutiveMatches = 0;
    let totalMatches = 0;

    const matchPositions: number[] = [];

    while (queryIndex < queryLower.length && tagIndex < tagLower.length) {
      if (queryLower[queryIndex] === tagLower[tagIndex]) {
        matchPositions.push(tagIndex);
        totalMatches++;
        queryIndex++;
        consecutiveMatches++;
      } else {
        consecutiveMatches = 0;
      }
      tagIndex++;
    }

    // If not all query characters were found in tag, no match
    if (queryIndex < queryLower.length) {
      return 0;
    }

    // Calculate base score based on match quality
    let score = 100;

    // Bonus for consecutive matches
    if (consecutiveMatches > 0) {
      score += consecutiveMatches * 50;
    }

    // Bonus for matching at the start of the tag
    if (matchPositions[0] === 0) {
      score += 200;
    }

    // Bonus for matching at word boundaries (after /, -, _, or space)
    const wordBoundaries = ['/', '-', '_', ' '];
    matchPositions.forEach((pos) => {
      if (pos > 0 && wordBoundaries.includes(tagLower[pos - 1])) {
        score += 150;
      }
    });

    // Penalty for how far into the tag the first match is
    if (matchPositions.length > 0) {
      const firstMatchPos = matchPositions[0];
      score -= firstMatchPos * 2;
    }

    // Penalty for gaps between matches (non-consecutive)
    let lastPos = -1;
    let gaps = 0;
    matchPositions.forEach((pos) => {
      if (lastPos !== -1 && pos - lastPos > 1) {
        gaps += pos - lastPos - 1;
      }
      lastPos = pos;
    });
    score -= gaps * 5;

    // Bonus for shorter tags (when match quality is similar)
    score += Math.max(0, 100 - tagLower.length);

    // Apply frequency multiplier
    const frequency = this.frequencyMap.get(tag) || 0;
    const frequencyMultiplier = 1 + frequency * 0.1; // Max 2x boost for very frequent tags
    score *= frequencyMultiplier;

    return Math.max(1, score); // Return at least 1 for any match
  }
}
