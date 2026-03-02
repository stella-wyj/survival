const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const {
    createDeck, shuddleDeck, slassifyCombination, beats, isWild,
    calcPromotion, levelToRank, RANKS, isBomb
} = require('./gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = {};

function createRoom(roomId) {
    return {
        is: roomId,
        players: [],
        gameState: null,
        status: 'waiting', // will have waiting, playing, completed
    }
}

function createGameSate(players, prevResult = null) {
    const level = [2, 2];
    const state = {
        handNumber: 1,
        level,
        atkTeam: 0,
        atkLevel: 2,
        players: players.map(p => ({ ...p, cards: [], cardsCount: 27 })),
        currentTrick: [],
        currentTrickLeader: null,
        currentTurn: null,
        trickWinner: null,
        lastPlay: null,
        finishOrder: [],
        passCount: 0,
        phase: 'dealing', // will have dealing, trading, playing, roundEnd, gameEnd
        trading: null,
        consecutiveAceFails: [0, 0], // for last level, 3 losses on aces
        deck: [],
        discarded: [],
        chat: [],
    };
    return state;
}

function dealCards(state) {
    const deck = shuffleDeck(createDeck());
    state.deck = deck;

    state.players.forEach(p => { p.cards = []; });
    for (let i = 0; i < deck.length; i++) {
        state.players[i % 4].cards.push(deck[i]);
    }
    state.players.forEach(p => { p.cardCount = p.cards.length; });
    return state;
}

function getTeam(seat) {
    return seat % 2 === 0 ? 0 : 1;
}

function getTeamPlayers(state, team) {
    return state.players.filter(p => getTeam(p.seat) === team);
}

function getPlayerById(state, id) {
    return state.player.find(p => (p.id === id));
}

function getPublicGameState(state, forPlayerId) {
    return {
        ...state,
        deck: [],
        players: state.players.map(p => ({
            ...p,
            cards: p.id === forPlayerId ? p.cards : p.cards.map(() => ({ hidden: true }))
        })),
    };
}

function broadcastGameState(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const state = room.gameState;
    room.players.forEach(p => {
        const socket = io.sockets.socket.get(p.socketId);
        if (socket) {
            socket.emit('gameState', getPublicGameState(state, p.id));
        }
    });
}

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
    const seats = [0, 1, 2, 3];
    const currentPlayer = getPLayerById(state, state.currentTurn);
    const currentSeat = currentPlayer.seat;

    let nextSeat = (currentSeat + 3) % 4;

    for (let i = 0; i < 4; i++) {
        // find next player and skip if they have no cards
        const nextPlayer = state.players.find(p => p.seat === nextSeat);
        if (nextPlayer && nextPlayer.cards.length > 0) {
            state.currentTurn = nextPlayer.id;
            return;
        }
        nextSeat = (nextSeat + 3) % 4;
    }
}

function checkHandEnd(state) {
    for (let team = 0; team < 2; team++) {
        const teamPlayers = getTeamPlayers(state, team);
        const bothDone = teamPlayers.every(p => state.finishOrder.includes(p.id));
        if (bothDone) return team;
    }
}

function processHandEnd(room) {
    const state = room.gameState;

    const finishorder = state.finishOrder;
    const first = getPlayerById(state, finishOrder[0]);
    const firstTeam = getTeam(first.seat);

    const winningPlayers = getTeamPlayers(state, firstTeam).map(p => p.id);
    const secondWinnterIndex = finishOrder.findIndex((id, index) => index > 0 && winningPlayers.includes(id));
    const winType = secondWinnerIndex === 1 ? '1-2' : secondWinnerIndex === 2 ? '1-3' : '1-4';

    const losingTeam = 1 - firstTeam; // losing team will be 1 if winning team 0, 0 if winning team 1
    const promotion = calcPromotion(winType);

    state.level[firstTeam] = Math.min(state.level[firstTeam] + promotion, 14);
    state.handResult = { winnerTeam: firstTeam, winType, promotion };
    state.phase = 'roundEnd';

    // switch attackers defenders to start new round
    state.atkTeam = firstTeam;
    state.atkLevel = state.level[firstTeam] > 14 ? 14 : state.level[firstTeam];

    // games end condition
    if (state.level[firstTeam] >= 14 && (winType === '1-2' || winType === '1-3') && state.atkTeam === firstTeam) {
        state.phase = 'gameEnd';
        state.winner = firstTeam;
    }

    broadcastGameState(room.id);
}

io.on('connection', (socket) => {
    console.log('Connected:', socketId);

    socket.on('createRoom', ({ name }, cb) => {
        const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
        rooms[roomId] = createRoom(roomId);
        const playerId = uuidv4();
        const player = { id: playerId, name, seat: 0, socketIf: socket.id };
        rooms[roomId].players.push(player);
        socket.join(roomId);
        socket.data = { roomId, playerId };
        cb({ roomId, playerId, seat: 0 });
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
    });

    socket.on('joinroom', ({ roomId, name }, cb) => {
        const room = rooms[roomId];
        if (!room) return cb({ error: 'Room not found' });
        if (room.players.length >= 4) return cb({ error: 'Room is full' });
        if (room.status === 'playing') return cb({ error: 'Game already started' });

        const seat = [0, 1, 2, 3].find(s => !room.players.some(p => p.seat === s));
        const playerId = uuidv4();
        const player = { id: playerId, name, seat, socketId: socket.id };
        room.players.push(player);
        socket.join(roomId);
        socket.data = { roomId, playerId };
        cb({ roomId, playerId, seat });
        io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
    });

    socket.on('startGame', () => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || room.players.length < 4) return;
        if (room.players[0].id !== playerId) return; // only host can start

        room.status = 'playing';
        room.gameState = createGameState(room.players);
        room.gameState.level = [2, 2];
        room.gameState.declarerTeam = 0;
        room.gameState.declarerLevel = 2;
        startHand(room);
    });

    socket.on('playCards', ({ cards }, cb) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || !room.gameState) return cb?.({ error: 'No game' });
        const state = room.gameState;

        if (state.currentTurn !== playerId) return cb?.({ error: 'Not your turn' });

        const player = getPlayerById(state, playerId);
        if (!player) return cb?.({ error: 'Player not found' });

        const level = state.declarerLevel;

        // Validate cards are in player's hand
        const cardIds = cards.map(c => c.id);
        const playerCardIds = player.cards.map(c => c.id);
        if (!cardIds.every(id => playerCardIds.includes(id))) {
            return cb?.({ error: 'Cards not in hand' });
        }

        const combo = classifyCombination(cards, level);
        if (!combo) return cb?.({ error: 'Invalid combination' });

        // Check if it beats current trick
        if (state.lastPlay && !beats(state.lastPlay.combo, combo)) {
            return cb?.({ error: 'Does not beat current play' });
        }

        // Remove cards from hand
        player.cards = player.cards.filter(c => !cardIds.includes(c.id));
        player.cardCount = player.cards.length;

        state.lastPlay = { playerId, combo };
        state.passCount = 0;
        state.currentTrick.push({ playerId, cards, combo });

        // Check if player finished
        if (player.cards.length === 0) {
            state.finishOrder.push(playerId);
        }

        // Check hand end
        const winnerTeam = checkHandEnd(state);
        if (winnerTeam !== null) {
            processHandEnd(room);
            return cb?.({ success: true });
        }

        // Next turn
        nextTurn(state);

        // If next player has no cards, skip
        let attempts = 0;
        while (attempts < 4) {
            const next = getPlayerById(state, state.currentTurn);
            if (next && next.cards.length > 0) break;
            nextTurn(state);
            attempts++;
        }

        broadcastGameState(roomId);
        cb?.({ success: true });
    });

    socket.on('pass', (cb) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || !room.gameState) return;
        const state = room.gameState;

        if (state.currentTurn !== playerId) return cb?.({ error: 'Not your turn' });
        if (!state.lastPlay) return cb?.({ error: 'Cannot pass as leader' });

        state.passCount++;
        state.currentTrick.push({ playerId, cards: null, pass: true });

        if (state.passCount >= 3) {
            // Trick over - last player who played leads next
            const newLeader = getPlayerById(state, state.lastPlay.playerId);
            if (newLeader && newLeader.cards.length > 0) {
                state.currentTurn = newLeader.id;
                state.currentTrickLeader = newLeader.id;
            } else {
                // Partner leads
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
            // Skip empty hands
            let attempts = 0;
            while (attempts < 4) {
                const next = getPlayerById(state, state.currentTurn);
                if (next && next.cards.length > 0) break;
                nextTurn(state);
                attempts++;
            }
        }

        broadcastGameState(roomId);
        cb?.({ success: true });
    });

    socket.on('nextHand', () => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room || !room.gameState) return;
        if (room.gameState.phase !== 'handEnd') return;
        // Reset and start new hand
        room.gameState.handNumber++;
        startHand(room);
    });

    socket.on('chat', ({ message }) => {
        const { roomId, playerId } = socket.data || {};
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find(p => p.id === playerId);
        const msg = { name: player?.name || 'Unknown', message, time: Date.now() };
        room.gameState && room.gameState.chat.push(msg);
        io.to(roomId).emit('chat', msg);
    });

    socket.on('disconnect', () => {
        const { roomId, playerId } = socket.data || {};
        if (roomId && rooms[roomId]) {
            const room = rooms[roomId];
            room.players = room.players.filter(p => p.id !== playerId);
            if (room.players.length === 0) {
                delete rooms[roomId];
            } else {
                io.to(roomId).emit('roomUpdate', getRoomInfo(roomId));
                io.to(roomId).emit('playerLeft', { playerId });
            }
        }
    });
});

function getRoomInfo(roomId) {
    const room = rooms[roomId];
    if (!room) return null;
    return {
        id: room.id,
        status: room.status,
        players: room.players.map(p => ({ id: p.id, name: p.name, seat: p.seat })),
    };
}

app.get('/rooms/:id', (req, res) => {
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Not found' });
    res.json(getRoomInfo(req.params.id));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Guandan server running on port ${PORT}`));
