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
- In-game chat
- Beautiful dark green felt table aesthetic

## Project Structure

```
guandan/
├── server/           # Node.js + Socket.IO backend
│   ├── index.js      # Server entry point & socket handlers
│   ├── gameLogic.js  # Card game rules & combination validation
│   └── package.json
├── client/           # React frontend
│   ├── src/
│   │   ├── App.js              # Main app & socket management
│   │   └── components/
│   │       ├── Card.jsx        # Card & hand rendering
│   │       ├── GameTable.jsx   # Main game table layout
│   │       └── Lobby.jsx       # Lobby & waiting room UI
│   └── package.json
└── package.json      # Root with convenience scripts
```

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


### 3. Open in browser
- Client: http://localhost:3000
- Share your local IP (e.g. http://192.168.1.x:3000) for LAN multiplayer

## Hosting Online

### Option A: Deploy to a VPS (e.g. DigitalOcean, Linode)

1. **Build the client:**
   ```bash
   cd client && npm run build
   ```

2. **Serve static files from the server** (add to server/index.js):
   ```js
   const path = require('path');
   app.use(express.static(path.join(__dirname, '../client/build')));
   app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
   ```

3. **Set environment variables:**
   ```bash
   # In client/.env
   REACT_APP_SERVER_URL=https://yourdomain.com
   ```

4. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name guandan
   ```

5. **Nginx config:**
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;
     location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

### Option B: Railway / Render / Fly.io

1. Push to GitHub
2. Connect your repo to Railway or Render
3. Set build command: `cd client && npm install && npm run build`
4. Set start command: `node server/index.js`
5. Set `REACT_APP_SERVER_URL` env var to your deployment URL

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
