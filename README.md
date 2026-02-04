# Prioritization Matrix

A web-based pairwise comparison tool for prioritizing items. Compare items head-to-head to determine their relative importance and get a ranked list.

**[Live Demo](https://back1ply.github.io/prioritization-matrix/)**

## Features

- **Add Items** - Add 2-10 items to compare (labeled A-J)
- **Pairwise Comparisons** - Compare each pair of items one at a time
- **Ranked Results** - View final rankings based on win counts
- **Tie Handling** - Items with equal wins share the same rank
- **Auto-Save** - Progress saved to localStorage automatically
- **Responsive** - Works on desktop and mobile

## How It Works

1. Add the items you want to prioritize
2. Click "Start Comparisons"
3. For each pair, choose which item is more important
4. View your prioritized list when all comparisons are complete

The tool uses a round-robin tournament style comparison. For N items, you'll make N(N-1)/2 comparisons. For example:
- 3 items = 3 comparisons
- 5 items = 10 comparisons
- 10 items = 45 comparisons

## Usage

Open `index.html` in a browser, or visit the [live demo](https://back1ply.github.io/prioritization-matrix/).

## License

MIT
