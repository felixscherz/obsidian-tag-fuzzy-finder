# Obsidian Tag Fuzzy Finder

A powerful Obsidian plugin that enables fuzzy searching through tags in your vault with an intuitive quickswitcher-like interface.

## Features

- **Fuzzy Tag Search**: Search for tags with a flexible, forgiving search algorithm that matches partial queries
- **Hierarchical Tag Support**: Works seamlessly with nested tags like `area/travel`, `project/work/learning`
- **Quickswitcher-Like UI**: Familiar modal interface similar to Obsidian's built-in quickswitcher
- **Real-Time Suggestions**: Suggestions update as you type for instant feedback
- **Smart Ranking**: Results are ranked by:
  - Match quality (consecutive matches score higher)
  - Match position (matches at the beginning/word boundaries score higher)
  - Tag frequency (frequently used tags rank higher)
  - Tag length (shorter tags with equal match quality rank higher)
- **Direct Search Integration**: Selected tags automatically open Obsidian's built-in search with the appropriate search expression

## Installation

To install the plugin, you need two files: `main.js` and `manifest.json`.

1. **Get the files**:
   - Download `main.js` and `manifest.json` from the latest release (or build them from source)

2. **Create the plugin directory**:
   - Open your vault folder
   - Navigate to `.obsidian/plugins/` (create the `plugins` folder if needed)
   - Create a new folder named `obsidian-tag-fuzzy-finder`

3. **Add the plugin files**:
   - Copy `main.js` and `manifest.json` into the `obsidian-tag-fuzzy-finder` folder
   - Your final structure should be:
      ```
      your-vault/
      └── .obsidian/
          └── plugins/
              └── obsidian-tag-fuzzy-finder/
                  ├── main.js
                  └── manifest.json
      ```

4. **Enable the plugin**:
   - Restart Obsidian
   - Go to Settings → Community plugins → Installed plugins
   - Find "Tag Fuzzy Finder" and toggle it on

### Building from Source

```bash
git clone https://github.com/yourusername/obsidian-tag-fuzzy-finder.git
cd obsidian-tag-fuzzy-finder
npm install
npm run build
# Then follow installation steps above
```

For development with live reload:
```bash
npm run dev
```

## Usage

### Opening the Tag Fuzzy Finder

1. Open the command palette (`Cmd+P` on Mac, `Ctrl+P` on Windows/Linux)
2. Search for and select "Open Tag Fuzzy Finder"
3. Alternatively, set a custom hotkey in Obsidian settings for quick access

### Searching for Tags

1. Type in the search box to filter tags
2. As you type, matching tags appear in real-time with the best matches at the top
3. Use arrow keys to navigate through suggestions
4. Press `Enter` or click to select a tag

### What Happens When You Select a Tag

When you select a tag, the Obsidian search pane opens with a search expression matching that tag. For example:
- Selecting `area/travel` opens search with: `tag:#area/travel`
- Selecting `important` opens search with: `tag:#important`

This will show all notes that have been tagged with the selected tag.

## Examples

### Finding Tags with Hierarchies

If your vault contains tags like:
- `area/finances`
- `area/travel`
- `area/learning`

You can find them by typing:
- `travel` → matches `area/travel`
- `area` → matches all three area tags
- `fin` → matches `area/finances`
- `trav` → matches `area/travel`

### Mixed Case Queries

The search is case-insensitive, so:
- `TRAVEL`, `Travel`, `travel` all match `area/travel`

### Partial Matches

The fuzzy matching allows gaps in your search:
- `arfn` → matches `area/finances`
- `atv` → matches `area/travel`

## Architecture

The plugin consists of several key components:

- **TagCollector**: Scans the vault and extracts tags from YAML frontmatter and inline tags
- **TagManager**: Manages tag caching and cache invalidation when the vault changes
- **FuzzyMatcher**: Implements the fuzzy matching algorithm with intelligent scoring
- **TagFuzzyFinderModal**: Provides the user interface for searching and selecting tags

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

```bash
npm install
```

### Development Build

To build and watch for changes:

```bash
npm run dev
```

### Production Build

To create a production bundle:

```bash
npm run build
```

### Testing

Run the comprehensive test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Testing Details

The plugin includes 34 comprehensive unit tests for the fuzzy matching algorithm covering:

- **Basic Matching**: Exact matches, partial matches, case-insensitive matching
- **Multiple Tag Matching**: Multiple results, ranking, hierarchical tags
- **Scoring Logic**: Match position, word boundaries, consecutive matches, frequency boost
- **Result Ordering**: Score-based sorting, result limiting
- **Edge Cases**: Single character queries, long queries, special characters, empty inputs
- **Score Consistency**: Deterministic scoring across searches

All tests pass with high coverage of the fuzzy matching logic.

## How Fuzzy Matching Works

The fuzzy matcher uses a sophisticated scoring algorithm:

1. **Character Matching**: All characters from your query must exist in the tag in the same order (but not necessarily consecutive)
2. **Scoring Factors**:
   - **Exact Match** (1000+ points): Complete match with the tag
   - **Match Position** (-2 points per character before first match): Earlier matches score higher
   - **Consecutive Matches** (+50 points per consecutive character): Consecutive matching characters score higher
   - **Word Boundary Bonus** (+150 points): Matches after `/`, `-`, `_`, or space bonus
   - **Start Position Bonus** (+200 points): Matching at the very beginning
   - **Gap Penalty** (-5 points per gap): Gaps between matches reduce score
   - **Length Bonus** (up to +100 points): Shorter tags score slightly higher
   - **Frequency Multiplier** (1.0 to 2.0x): Frequently used tags score up to 2x higher

3. **Result Ranking**: Results are sorted by final score (highest first) and limited to top 50 results

## Performance

- **Tag Collection**: Scans entire vault once and caches results
- **Cache Invalidation**: Automatically updates when files are created, deleted, or modified
- **Debouncing**: Cache updates are debounced to avoid excessive re-collection
- **Fuzzy Matching**: Efficiently scores and ranks results in real-time

## Limitations

- **Obsidian Desktop Only**: The plugin currently works on Obsidian Desktop
- **Performance**: With very large vaults (10,000+ unique tags), there may be slight delays in tag collection
- **Search Integration**: Relies on Obsidian's native tag search syntax (`tag:#tagname`)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests on GitHub.

## License

MIT

## Troubleshooting

### No tags are showing up

1. Check that your vault actually has tags in it
2. Tags can be in:
   - YAML frontmatter: `tags: [tag1, tag2]` or `tags: tag1, tag2`
   - Inline tags in content: `#tag-name`
3. Try refreshing Obsidian or reopening the plugin

### Search isn't opening after selecting a tag

- Ensure you have the search core plugin enabled in Obsidian
- Try manually opening the search pane (Cmd+Shift+F / Ctrl+Shift+F) first, then try the fuzzy finder again

### Performance is slow

- If your vault has thousands of tags, the initial collection may take a moment
- Subsequent searches use cached results and should be fast
- Try closing and reopening the modal if performance seems degraded

## Roadmap

Potential future enhancements:

- Hierarchical tag visualization and filtering
- Tag frequency statistics
- Multiple tag selection and combined searches
- Tag sorting options
- Custom tag display formatting
- Tag creation from the modal

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
