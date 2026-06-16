# 掼蛋 Guandan - Multiplayer Card Game

A real-time multiplayer implementation of the Chinese card game Guandan (掼蛋), built with React and Socket.IO.

## Features
- Real-time 4-player multiplayer via WebSockets
- Full Guandan rules implementation including:
  - All 7 combination types (singles, pairs, triples, full houses, straights, tubes, plates)
  - All 9 bomb types (quadruples through decuples, straight flushes, four-joker)
  - Wild cards (level cards in hearts)
  - Level progression system (2 through Ace)
  - Win conditions and scoring

## Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm

### 1. Install dependencies

```bash
# From the guandan root directory
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### 2. Run in development

```bash
# Install concurrently if not already:
npm install

# Run both server and client:
# First run the server
npm run dev

# Second run the client
npm run dev
```

## How to Play

1. **Create a Room** - One player creates a room and shares the 6-character code
2. **Join** - Three others join using the code
3. **Host starts the game** when all 4 players are seated
4. **Teams**: Seats 1 & 3 vs Seats 2 & 4 (partners sit opposite)

### Basic Rules
- Play cards in combinations (singles, pairs, triples, straights, etc.)
- Higher combinations of the same type beat lower ones
- Bombs beat all non-bombs; higher bombs beat lower ones
- First team to have both players empty their hands wins
- Win type (1-2, 1-3, 1-4) determines level advancement
- First team to reach and win on level Ace (A) wins the game

### Wild Cards
- The two heart cards of the current level are wild
- They can substitute for any non-joker card
- Declare what they represent when you play them

## Known Limitations / Future Improvements
- Tribute system (card exchange between hands) is simplified
- No spectator mode
- No reconnection handling
- No AI players for offline play
- Sound effects not included
