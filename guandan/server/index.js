const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const {
    createDeck, shuffleDeck, classifyCombination, beats,
    calcPromotion, levelToRank, RANKS, isBomb
} = require('./gameLogic');
const { takeBotTurn, getPersonality } = require('./botAgent');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = {};

// ─── Room & state helpers ────────────────────────────────────────────────────

function createRoom(roomId) {
    return {
        id: roomId,
        players: [],        // human players only (have socketId)
        allPlayers: [],     // all 4 seats (humans + bots)
        gameState: null,
        status: 'waiting',
        botTurnPending: false,
    };
}

function createGameState(allPlayers) {
    return {
        handNumber: 1,
        level: [2, 2],
        atkTeam: 0,
        atkLevel: 2,
        players: allPlayers.map(p => ({ ...p, cards: [], cardCount: 27 })),
        currentTrick: [],
        currentTrickLeader: null,
        currentTurn: null,
        trickWinner: null,
        lastPlay: null,
        finishOrder: [],
        passCount: 0,
        phase: 'dealing',
        handResult: null,
        consecutiveAceFails: [0, 0],
        deck: [],
        discarded: [],
        // chat: [],
    };
}

function dealCards(state) {
    const deck = shuffleDeck(createDeck());
    state.deck = deck;
    state.players.forEach(p => { p.cards = []; });
    for (let i = 0; i < deck.length; i++) {
        state.players[i % 4].cards.push(deck[i]);
    }
    let cardId = 0;
    state.players.forEach(p => {
        p.cards = p.cards.map(c => ({ ...c, id: `c${cardId++}` }));
        p.cardCount = p.cards.length;
    });
    return state;
}

function getTeam(seat) { return seat % 2 === 0 ? 0 : 1; }

function getTeamPlayers(state, team) {
    return state.players.filter(p => getTeam(p.seat) === team);
}

function getPlayerById(state, id) {
    return state.players.find(p => p.id === id);
}

function getPublicGameState(state, forPlayerId) {
    return {
        ...state,
        deck: [],
        players: state.players.map(p => ({
            ...p,
            cards: p.id === forPlayerId ? p.cards : p.cards.map(() => ({ hidden: true })),
        })),
    };
}

function broadcastGameState(roomId) {
    const room = rooms[roomId];
    if (!room?.gameState) return;
    const state = room.gameState;
    // Send personalised view to each human
    room.players.forEach(p => {
        const sock = io.sockets.sockets.get(p.socketId);
        if (sock) sock.emit('gameState', getPublicGameState(state, p.id));
    });
}

// function broadcastChat(roomId, msg) {
//     const room = rooms[roomId];
//     if (!room) return;
//     room.gameState?.chat.push(msg);
//     io.to(roomId).emit('chat', msg);
// }

function getRoomInfo(roomId) {
    const room = rooms[roomId];
    if (!room) return null;
    return {
        id: room.id,
        status: room.status,
        players: room.allPlayers.map(p => ({
            id: p.id,
            name: p.name,
            seat: p.seat,
            isBot: !!p.isBot,
            botEmoji: p.personality?.emoji,
        })),
    };
}

// ─── Hand flow ────────────────────────────────────────────────────────────────

function startHand(room) {
    const state = room.gameState;
    state.finishOrder = [];
    state.currentTrick = [];
    state.lastPlay = null;
    state.passCount = 0;
    state.phase = 'playing';
    state.handResult = null;

    dealCards(state);

    const atkPlayers = getTeamPlayers(state, state.atkTeam);
    state.currentTurn = atkPlayers[0].id;
    state.currentTrickLeader = atkPlayers[0].id;
}

function nextTurn(state) {
    const currentPlayer = getPlayerById(state, state.currentTurn);
    if (!currentPlayer) return;
    let nextSeat = (currentPlayer.seat + 3) % 4;
    for (let i = 0; i < 4; i++) {
        const next = state.players.find(p => p.seat === nextSeat);
        if (next && next.cards.length > 0) {
            state.currentTurn = next.id;
            return;
        }
        nextSeat = (nextSeat + 3) % 4;
    }
}

function skipEmptyHands(state) {
    for (let i = 0; i < 4; i++) {
        const next = getPlayerById(state, state.currentTurn);
        if (next && next.cards.length > 0) break;
        nextTurn(state);
    }
}

function checkHandEnd(state) {
    for (let team = 0; team < 2; team++) {
        const teamPlayers = getTeamPlayers(state, team);
        if (teamPlayers.every(p => state.finishOrder.includes(p.id))) return team;
    }
    return null;
}

function processHandEnd(room) {
    const state = room.gameState;
    const first = getPlayerById(state, state.finishOrder[0]);
    const firstTeam = getTeam(first.seat);
    const winningIds = getTeamPlayers(state, firstTeam).map(p => p.id);
    const secondIdx = state.finishOrder.findIndex((id, i) => i > 0 && winningIds.includes(id));
    const winType = secondIdx === 1 ? '1-2' : secondIdx === 2 ? '1-3' : '1-4';
    const promotion = calcPromotion(winType);

    state.level[firstTeam] = Math.min(state.level[firstTeam] + promotion, 14);
    state.handResult = { winnerTeam: firstTeam, winType, promotion };
    state.phase = 'handEnd';
    state.atkTeam = firstTeam;
    state.atkLevel = Math.min(state.level[firstTeam], 14);

    if (state.level[firstTeam] >= 14 && (winType === '1-2' || winType === '1-3')) {
        state.phase = 'gameEnd';
        state.winner = firstTeam;
    }

    broadcastGameState(room.id);
}

// ─── Core play/pass logic (shared by humans & bots) ──────────────────────────

function applyPlay(room, playerId, cards, comboOverride) {
    const state = room.gameState;
    const player = getPlayerById(state, playerId);
    if (!player) return { error: 'Player not found' };
    if (state.currentTurn !== playerId) return { error: 'Not your turn' };

    const level = state.atkLevel || 2;
    const cardIds = cards.map(c => c.id);
    const playerCardIds = player.cards.map(c => c.id);
    if (!cardIds.every(id => playerCardIds.includes(id))) return { error: 'Cards not in hand' };

    const combo = comboOverride || classifyCombination(cards, level);
    if (!combo) return { error: 'Invalid combination' };
    if (state.lastPlay && !beats(state.lastPlay.combo, combo)) return { error: 'Does not beat current play' };

    player.cards = player.cards.filter(c => !cardIds.includes(c.id));
    player.cardCount = player.cards.length;
    state.lastPlay = { playerId, combo };
    state.passCount = 0;
    state.currentTrick.push({ playerId, cards, combo });

    if (player.cards.length === 0) state.finishOrder.push(playerId);

    const winnerTeam = checkHandEnd(state);
    if (winnerTeam !== null) {
        processHandEnd(room);
        return { success: true, handEnded: true };
    }

    nextTurn(state);
    skipEmptyHands(state);
    broadcastGameState(room.id);
    return { success: true };
}

function applyPass(room, playerId) {
    const state = room.gameState;
    if (state.currentTurn !== playerId) return { error: 'Not your turn' };
    if (!state.lastPlay) return { error: 'Cannot pass as leader' };

    state.passCount++;
    state.currentTrick.push({ playerId, cards: null, pass: true });

    if (state.passCount >= 3) {
        const newLeader = getPlayerById(state, state.lastPlay.playerId);
        if (newLeader && newLeader.cards.length > 0) {
            state.currentTurn = newLeader.id;
            state.currentTrickLeader = newLeader.id;
        } else {
            const team = getTeam(newLeader.seat);
            const partner = getTeamPlayers(state, team).find(p => p.id !== newLeader.id);
            if (partner && partner.cards.length > 0) {
                state.currentTurn = partner.id;
                state.currentTrickLeader = partner.id;
            }
        }
        state.lastPlay = null;
        state.passCount = 0;
        state.currentTrick = [];
    } else {
        nextTurn(state);
        skipEmptyHands(state);
    }

    broadcastGameState(room.id);
    return { success: true };
}

// ─── Bot orchestration ────────────────────────────────────────────────────────

function isBot(room, playerId) {
    return room.allPlayers.find(p => p.id === playerId)?.isBot === true;
}

// Called after every state change — if it's a bot's turn, schedule their move
function maybeScheduleBotTurn(room) {
    if (!room.gameState || room.gameState.phase !== 'playing') return;
    const currentId = room.gameState.currentTurn;
    if (!currentId || !isBot(room, currentId)) return;
    if (room.botTurnPending) return;

    room.botTurnPending = true;

    takeBotTurn(
        room,
        currentId,
        (r, pid, cards, combo) => {
            room.botTurnPending = false;
            const result = applyPlay(r, pid, cards, combo);
            if (!result.handEnded) maybeScheduleBotTurn(room);
        },
        (r, pid) => {
            room.botTurnPending = false;
            applyPass(r, pid);
            maybeScheduleBotTurn(room);
        },
        // broadcastChat,
    );
}

// ─── Socket handlers ──────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('createRoom', ({ name }, cb) => {
        const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
        rooms[roomId] = createRoom(roomId);
        const playerId = uuidv4();
        const player = { id: playerId, name, seat: 0, socketId: socket.id, isBot: false };
        rooms[roomId].players.push(player);
        rooms[roomId].allPlayers.push(player);
        socket.join(roomId);
        socket.data = { roomId, playerId };
        cb({ roomId, playerId, seat: 0 });
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
    });

    socket.on('joinRoom', ({ roomId, name }, cb) => {
        const room = rooms[roomId];
        if (!room) return cb({ error: 'Room not found' });
        if (room.allPlayers.length >= 4) return cb({ error: 'Room is full' });
        if (room.status === 'playing') return cb({ error: 'Game already started' });

        const seat = [0, 1, 2, 3].find(s => !room.allPlayers.some(p => p.seat === s));
        const playerId = uuidv4();
        const player = { id: playerId, name, seat, socketId: socket.id, isBot: false };
        room.players.push(player);
        room.allPlayers.push(player);
        socket.join(roomId);
        socket.data = { roomId, playerId };
        cb({ roomId, playerId, seat });
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
    });

    // Fill empty seats with AI bots and start immediately
    socket.on('startWithBots', ({ roomId: rid, playerId: pid } = {}) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room) return;
        if (room.players[0]?.id !== playerId) return; // only host

        // Fill remaining seats with bots
        const takenSeats = room.allPlayers.map(p => p.seat);
        const emptySeats = [0, 1, 2, 3].filter(s => !takenSeats.includes(s));

        let botNum = 0;
        for (const seat of emptySeats) {
            const personality = getPersonality(seat);
            const bot = {
                id: uuidv4(),
                name: personality.name,
                seat,
                isBot: true,
                personality,
                socketId: null,
                cards: [],
                cardCount: 27,
            };
            room.allPlayers.push(bot);
            botNum++;
        }

        room.status = 'playing';
        room.gameState = createGameState(room.allPlayers);
        room.gameState.level = [2, 2];
        room.gameState.atkTeam = 0;
        room.gameState.atkLevel = 2;
        startHand(room);
        broadcastGameState(roomId);
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));

        // Kick off bot turns if needed
        maybeScheduleBotTurn(room);
    });

    socket.on('startGame', () => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || room.allPlayers.length < 4) return;
        if (room.players[0]?.id !== playerId) return;

        room.status = 'playing';
        room.gameState = createGameState(room.allPlayers);
        room.gameState.level = [2, 2];
        room.gameState.atkTeam = 0;
        room.gameState.atkLevel = 2;
        startHand(room);
        broadcastGameState(roomId);
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
        maybeScheduleBotTurn(room);
    });

    socket.on('playCards', ({ cards }, cb) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || !room.gameState) return cb?.({ error: 'No game' });

        const result = applyPlay(room, playerId, cards);
        cb?.(result);
        if (result.success && !result.handEnded) maybeScheduleBotTurn(room);
    });

    socket.on('pass', (cb) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || !room.gameState) return cb?.({ error: 'No game' });

        const result = applyPass(room, playerId);
        cb?.(result);
        if (result.success) maybeScheduleBotTurn(room);
    });

    socket.on('nextHand', () => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room?.gameState || room.gameState.phase !== 'handEnd') return;
        room.gameState.handNumber++;
        startHand(room);
        broadcastGameState(roomId);
        maybeScheduleBotTurn(room);
    });

    // socket.on('chat', ({ message }) => {
    //     const { roomId, playerId } = socket.data || {};
    //     const room = rooms[roomId];
    //     if (!room) return;
    //     const player = room.players.find(p => p.id === playerId);
    //     broadcastChat(roomId, {
    //         name: player?.name || 'Unknown',
    //         message,
    //         time: Date.now(),
    //         isBot: false,
    //     });
    // });

    socket.on('disconnect', () => {
        const { roomId, playerId } = socket.data || {};
        if (roomId && rooms[roomId]) {
            const room = rooms[roomId];
            room.players = room.players.filter(p => p.id !== playerId);
            room.allPlayers = room.allPlayers.filter(p => p.id !== playerId || p.isBot);
            if (room.players.length === 0) {
                delete rooms[roomId];
            } else {
                io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
                io.to(roomId).emit('playerLeft', { playerId });
            }
        }
    });
});

// ─── HTTP routes ──────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '../client/dist')));

// 2. Redirect all web requests to your frontend index.html file
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.get('/rooms/:id', (req, res) => {
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Not found' });
    res.json(getRoomInfo(req.params.id));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Guandan server running on port ${PORT}`));