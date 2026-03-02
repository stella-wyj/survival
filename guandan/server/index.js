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
    cors: { origin: '*', methods: ['GET', 'POST']}
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
        players: players.map(p => ({...p, cards: [], cardsCount: 27})),
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

function getTeam(seat){
    return seat % 2 === 0 ? 0:1;
}

function getTeamPlayers(state, team){
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
            cards: p.id === forPlayerId ? p.cards : p.cards.map(() => ({hidden: true}))
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
        const nextPlayer = state.players.find(p => p .seat === nextSeat);
        if (nextPlayer && nextPlayer.cards.length > 0) {
            state.currentTurn = nextPlayer.id;
            return;
        }
        nextSeat = (nextSeat + 3) % 4; 
    }
}

function checkHandEnd(state) {
    for (let team = 0; team < 2; team++){
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