import { Plugin, Notice } from 'obsidian';
import { TagFuzzyFinderModal } from './components/TagFuzzyFinderModal';
import { TagManager } from './services/TagManager';

export default class TagFuzzyFinderPlugin extends Plugin {
  private tagManager: TagManager;

  async onload() {
    console.log('Loading Tag Fuzzy Finder plugin');

    // Initialize tag manager
    this.tagManager = new TagManager(this.app);

    // Register the command
    this.addCommand({
      id: 'open-tag-fuzzy-finder',
      name: 'Open Tag Fuzzy Finder',
      callback: () => this.openTagFuzzyFinder(),
    });

    console.log('Tag Fuzzy Finder plugin loaded successfully');
  }

  onunload() {
    console.log('Unloading Tag Fuzzy Finder plugin');
  }

  private openTagFuzzyFinder() {
    const modal = new TagFuzzyFinderModal(this.app, this.tagManager);
    modal.open();
  }
}
