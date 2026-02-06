# The Arcade Madness 🎮

A collection of classic arcade games built with vanilla JavaScript and HTML5 Canvas.

## Games Included

- **Tetris** - Stack falling blocks to clear lines
- **Snake** - Eat food and grow without hitting walls  
- **Sokoban** - Push boxes to their goal positions
- **Pac-Man** - Eat pellets and avoid ghosts

## Project Structure

\\\
arcade-madness/
├── index.html              # Main landing page
├── css/                    # Stylesheets
├── js/
│   ├── core/              # Game engine utilities
│   ├── games/             # Individual game implementations
│   └── ui/                # UI components
├── assets/                # Images, audio, fonts
├── data/                  # Level data
└── docs/                  # Documentation
\\\

## Getting Started

1. Clone this repository
2. Open \index.html\ in a modern web browser
3. Select a game and start playing!

## Development

This project uses vanilla JavaScript with no build tools required. Simply edit the files and refresh your browser.

### Core Components

- **GameEngine** - Base class for all games
- **InputHandler** - Keyboard and touch input management
- **Renderer** - Canvas drawing utilities
- **AudioManager** - Sound effects and music
- **Scoreboard** - Score tracking and persistence

## Deployment

See \deployment/\ folder for IIS configuration and deployment instructions.

## License

MIT License - feel free to use for your own projects!
