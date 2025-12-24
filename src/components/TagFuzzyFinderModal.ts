import { App, SuggestModal, Notice } from 'obsidian';
import { TagManager } from '../services/TagManager';
import { FuzzyMatcher } from '../services/FuzzyMatcher';

export class TagFuzzyFinderModal extends SuggestModal<string> {
  private tagManager: TagManager;
  private allTags: string[] = [];
  private fuzzyMatcher: FuzzyMatcher;
  private filteredTags: string[] = [];

  constructor(app: App, tagManager: TagManager) {
    super(app);
    this.tagManager = tagManager;
    this.fuzzyMatcher = new FuzzyMatcher();

    // Set placeholder and instructions
    this.setPlaceholder('Search for tags...');
    this.setInstructions([
      { command: '↵', purpose: 'to open tag in search' },
      { command: 'esc', purpose: 'to dismiss' },
    ]);
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      // Load tags on first call (when query is empty on open)
      if (this.allTags.length === 0) {
        this.allTags = await this.tagManager.getTags();

        if (this.allTags.length === 0) {
          console.warn('[Tag Fuzzy Finder] No tags found in vault');
          return [];
        }

        // Initialize frequency map for fuzzy matcher
        const frequencyMap = await this.tagManager.getTagFrequency();
        this.fuzzyMatcher.setFrequencyMap(frequencyMap);

        console.log(`[Tag Fuzzy Finder] Loaded ${this.allTags.length} tags`);
      }

      // Filter tags based on query
      if (query.trim() === '') {
        // Show all tags if no query
        this.filteredTags = this.allTags;
      } else {
        // Use our custom fuzzy matcher
        const results = this.fuzzyMatcher.search(query, this.allTags);
        this.filteredTags = results.map((r) => r.tag);
        console.log(`[Tag Fuzzy Finder] Query: "${query}" -> ${this.filteredTags.length} results`);
      }

      return this.filteredTags;
    } catch (error) {
      console.error('[Tag Fuzzy Finder] Error in getSuggestions:', error);
      new Notice('Error searching tags');
      return [];
    }
  }

  renderSuggestion(tag: string, el: HTMLElement): void {
    const container = el.createDiv('suggestion-content');
    const titleEl = container.createDiv('suggestion-title');
    titleEl.textContent = tag;
  }

  async onChooseSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): Promise<void> {
    try {
      console.log(`[Tag Fuzzy Finder] Selected tag: ${tag}`);
      this.openSearchWithTag(tag);
    } catch (error) {
      console.error('[Tag Fuzzy Finder] Error opening search:', error);
      new Notice('Error opening search');
    }
  }

  /**
   * Open the search pane with the selected tag
   */
  private openSearchWithTag(tag: string): void {
    const searchExpression = `tag:#${tag}`;

    // Close this modal
    this.close();

    // Try to find existing search leaf using proper Obsidian API
    let searchLeaf = this.app.workspace.getLeavesOfType('search')[0];

    if (!searchLeaf) {
      // Create new search leaf in left sidebar if one doesn't exist
      const leftLeaf = this.app.workspace.getLeftLeaf(false);
      if (!leftLeaf) {
        new Notice('Error: Could not create search pane');
        return;
      }
      searchLeaf = leftLeaf;
      searchLeaf.setViewState({
        type: 'search',
      });
    }

    // Reveal the search pane
    this.app.workspace.revealLeaf(searchLeaf);

    // Set the search query using the search view's interface
    const searchView = searchLeaf.view as any;
    if (searchView) {
      // Try to access the search component in different ways depending on Obsidian version
      if (searchView.setQuery && typeof searchView.setQuery === 'function') {
        // Newer API
        searchView.setQuery(searchExpression);
      } else if (searchView.dom && searchView.dom.inputEl) {
        // Older API
        searchView.dom.inputEl.value = searchExpression;
        if (typeof searchView.dom.submitSearch === 'function') {
          searchView.dom.submitSearch();
        }
      } else if (searchView.inputEl) {
        // Alternative path
        searchView.inputEl.value = searchExpression;
        // Dispatch change event to trigger search
        searchView.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    new Notice(`Searching for tag: ${tag}`);
  }
}

