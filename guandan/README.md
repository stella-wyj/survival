# 掼蛋 Guandan - Multiplayer Card Game

A real-time multiplayer implementation of the Chinese card game Guandan (掼蛋), built with React and Socket.IO.

PLAY IT LIVE AT: https://guandan-kvyi.onrender.com/

## Features
- Real-time 4-player multiplayer via WebSockets
- Full Guandan rules implementation including:
  - All 7 combination types (singles, pairs, triples, full houses, straights, tubes, plates)
  - All 9 bomb types (quadruples through decuples, straight flushes, four-joker)
  - Wild cards (level cards in hearts)
  - Level progression system (2 through Ace)
  - Win conditions and scoring

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
