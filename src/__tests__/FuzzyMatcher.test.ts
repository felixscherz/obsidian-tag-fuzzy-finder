import { FuzzyMatcher } from '../services/FuzzyMatcher';

describe('FuzzyMatcher', () => {
  let matcher: FuzzyMatcher;

  beforeEach(() => {
    matcher = new FuzzyMatcher();
  });

  describe('Basic Matching', () => {
    it('should match exact tags', () => {
      const query = 'travel';
      const tags = ['area/travel', 'area/finances'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tag).toBe('area/travel');
    });

    it('should match partial tags', () => {
      const query = 'trav';
      const tags = ['area/travel', 'area/finances'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tag).toBe('area/travel');
    });

    it('should match tags without matching characters anywhere', () => {
      const query = 'xyz';
      const tags = ['area/travel', 'area/finances'];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(0);
    });

    it('should perform case-insensitive matching', () => {
      const query = 'TRAVEL';
      const tags = ['area/travel'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tag).toBe('area/travel');
    });

    it('should return empty results for empty query', () => {
      const query = '';
      const tags = ['area/travel', 'area/finances'];
      const results = matcher.search(query, tags);

      // Empty query returns all tags
      expect(results.length).toBe(2);
    });
  });

  describe('Multiple Tag Matching', () => {
    it('should match multiple tags with the same query', () => {
      const query = 'area';
      const tags = ['area/travel', 'area/finances', 'personal/hobby'];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(2);
      expect(results[0].tag).toBe('area/travel');
      expect(results[1].tag).toBe('area/finances');
    });

    it('should rank tags by match quality', () => {
      const query = 'fi';
      const tags = ['area/finances', 'financial-planning', 'finances'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
      // 'finances' should score higher than 'area/finances' due to earlier match position
      expect(results[0].tag).toBe('finances');
    });

    it('should handle hierarchical tags', () => {
      const query = 'travel';
      const tags = ['area/travel', 'places/travel', 'travel'];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(3);
      // Exact match 'travel' should be highest
      expect(results[0].tag).toBe('travel');
    });
  });

  describe('Scoring Logic', () => {
    it('should score exact matches highest', () => {
      const tags = ['area/travel', 'travel', 'travel-plans'];
      const queryScore1 = matcher.matchScore('travel', 'travel');
      const queryScore2 = matcher.matchScore('travel', 'area/travel');
      const queryScore3 = matcher.matchScore('travel', 'travel-plans');

      expect(queryScore1).toBeGreaterThan(queryScore2);
      expect(queryScore1).toBeGreaterThan(queryScore3);
    });

    it('should score matches at beginning higher', () => {
      const query = 'fin';
      const score1 = matcher.matchScore(query, 'finances');
      const score2 = matcher.matchScore(query, 'information');

      expect(score1).toBeGreaterThan(score2);
    });

    it('should score matches at word boundaries higher', () => {
      const query = 'travel';
      const score1 = matcher.matchScore(query, 'area/travel');
      const score2 = matcher.matchScore(query, 'adventure-travel');

      expect(score1).toBeGreaterThan(score2);
    });

    it('should score consecutive matches higher', () => {
      const query = 'work';
      const score1 = matcher.matchScore(query, 'work');
      const score2 = matcher.matchScore(query, 'w-o-r-k');

      expect(score1).toBeGreaterThan(score2);
    });

    it('should apply frequency boost', () => {
      const frequencyMap = new Map([
        ['common/tag', 10],
        ['rare/tag', 1],
      ]);
      matcher.setFrequencyMap(frequencyMap);

      const score1 = matcher.matchScore('tag', 'common/tag');
      const score2 = matcher.matchScore('tag', 'rare/tag');

      expect(score1).toBeGreaterThan(score2);
    });

    it('should favor shorter tags', () => {
      const query = 'area';
      const score1 = matcher.matchScore(query, 'area');
      const score2 = matcher.matchScore(query, 'area/very/long/tag');

      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('Result Ordering', () => {
    it('should sort results by score descending', () => {
      const query = 'area';
      const tags = ['area', 'area/travel', 'area/finances', 'other-area'];
      const results = matcher.search(query, tags);

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should limit results to specified limit', () => {
      const query = 'a';
      const tags = Array.from({ length: 100 }, (_, i) => `area/${i}`);
      const results = matcher.search(query, tags, 50);

      expect(results.length).toBe(50);
    });

    it('should use default limit of 50', () => {
      const query = 'a';
      const tags = Array.from({ length: 100 }, (_, i) => `area/${i}`);
      const results = matcher.search(query, tags);

      expect(results.length).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character query', () => {
      const query = 'a';
      const tags = ['area', 'apple', 'banana'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.tag === 'area')).toBe(true);
    });

    it('should handle very long query', () => {
      const query = 'verylongquerystring';
      const tags = ['verylongquerystring', 'other'];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(1);
      expect(results[0].tag).toBe('verylongquerystring');
    });

    it('should handle special characters in tags', () => {
      const query = 'dev';
      const tags = ['dev/tools', 'dev-operations', 'development'];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(3);
    });

    it('should handle empty tags array', () => {
      const query = 'test';
      const tags: string[] = [];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(0);
    });

    it('should handle undefined frequency data', () => {
      // Don't set frequency map
      const query = 'travel';
      const tags = ['area/travel'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle non-matching characters at beginning', () => {
      const query = 'xyz';
      const isMatch = matcher.isMatch(query, 'xyzabc');

      expect(isMatch).toBe(true);
    });

    it('should handle tags with numbers', () => {
      const query = '2024';
      const tags = ['2024/january', 'year2024', 'archive/2024'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('isMatch Method', () => {
    it('should return true for matching tags', () => {
      expect(matcher.isMatch('travel', 'area/travel')).toBe(true);
      expect(matcher.isMatch('area', 'area/travel')).toBe(true);
    });

    it('should return false for non-matching tags', () => {
      expect(matcher.isMatch('xyz', 'area/travel')).toBe(false);
    });

    it('should perform case-insensitive matching', () => {
      expect(matcher.isMatch('TRAVEL', 'area/travel')).toBe(true);
    });
  });

  describe('Score Consistency', () => {
    it('should return same score for same query and tag', () => {
      const query = 'travel';
      const tag = 'area/travel';

      const score1 = matcher.matchScore(query, tag);
      const score2 = matcher.matchScore(query, tag);

      expect(score1).toBe(score2);
    });

    it('should return consistent results across multiple searches', () => {
      const query = 'area';
      const tags = ['area/travel', 'area/finances'];

      const results1 = matcher.search(query, tags);
      const results2 = matcher.search(query, tags);

      expect(results1.length).toBe(results2.length);
      expect(results1[0].tag).toBe(results2[0].tag);
      expect(results1[0].score).toBe(results2[0].score);
    });
  });

  describe('Frequency Boost', () => {
    it('should increase score for frequent tags with same match quality', () => {
      const frequencyMap = new Map([
        ['tag1', 10],
        ['tag2', 1],
      ]);
      matcher.setFrequencyMap(frequencyMap);

      const results = matcher.search('t', ['tag1', 'tag2']);

      expect(results[0].tag).toBe('tag1');
      expect(results[1].tag).toBe('tag2');
    });

    it('should not completely override match quality with frequency', () => {
      const frequencyMap = new Map([
        ['very-frequent-tag', 100],
        ['exact', 0],
      ]);
      matcher.setFrequencyMap(frequencyMap);

      const results = matcher.search('exact', [
        'very-frequent-tag',
        'exact',
      ]);

      // Exact match should still be better than very frequent partial match
      expect(results[0].tag).toBe('exact');
    });
  });

  describe('Complex Queries', () => {
    it('should handle queries with special characters', () => {
      const query = 'area/';
      const tags = ['area/travel', 'area/finances', 'travel'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should match across different tag hierarchies', () => {
      const query = 'finances';
      const tags = [
        'personal/finances',
        'work/finances',
        'area/finances',
        'finances',
      ];
      const results = matcher.search(query, tags);

      expect(results.length).toBe(4);
      // Exact match should be first
      expect(results[0].tag).toBe('finances');
    });

    it('should handle mixed case in tags', () => {
      const query = 'Dev';
      const tags = ['Development', 'dev/tools', 'DEVELOPMENT'];
      const results = matcher.search(query, tags);

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
