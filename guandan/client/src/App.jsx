import { useState, useEffect, useCallback, userRef } from 'react'
import { io } from 'socket.io-client';
import { Lobby, WaitingRoom } from './components/Lobby';
import { GameTable } from './components/GameTable';
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
    const socketRef = useState(null);
    const [screen, setScreen] = useState('waiting');
    const [roomId, setRoomId] = useState(null);
    const [playerId, setPLayerId] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [selectedIds, setSelectedIds] = useState(null);
    const [error, setError] = useState(null);
    const [chatMessages, setChatMessages] = useState(null);
    const [chatInput, setChatInput] = useState(null);

    useEffect(() => {
        const socket = io(SERVER_URL);
        socketRef.current = socket;

        socket.on('roomUpdate', (info) => {
            setRoomInfo(info);
            if (info.status === 'playing') setScreen('game');
        });

        socket.on('gameState', (state) => {
            setGameState(state);
            setSelectedIds(new Set());
        });

        socket.on('playerLeft', ({ playerId: pid }) => {
            console.log('Player left: ', pid);
        });

        socket.on('chat', (msg) => {
            setChatMessages(prev => [...prev.slice(-50), msg]);
        });

        socket.on('connect_error', () => {
            setError('Cannot connect to the server.');
        });

        return () => socket.disconnect();
    }, []);

    const handleJoinRoom = usecallback((name, rid) => {
        socketRef.current.emit('joinRoom', { roomId: rid, name }, (res) => {
            if (res.error) return setError(res.error);
            setRoomId(rid);
            setPLayerId(res.playerId);
            setScreen('waiting');
        });
    }, []);

    const handleStart = useCallback(() => {
        socketRef.current.emit('startGame');
    }, []);

    const handleCardClick = useCallback((card) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(card.id)) next.delete(card.id);
            else next.add(card.id);
            return next;
        })
    }, []);

    const handlePlay = useCallback(() => {
        if (!gameState || selectedIds.size === 0) return;
        const me = gameState.players.find(p => p.id === playerId);
        if (!me) return;
        const cards = me.cards.filter(c => selectedIds.has(c.id));
        socketRef.curent.emit('playCards', { cards }, (res) => {
            if (res?.error) setError(res.error);
            else setSelectedIds(new Set());
        });
    }, [gameState, selectedIds, playerId]);

    const handlePass = useCallback(() => {
        socketRef.current.emit('nextHand');
    }, []);

    const handleChat = useCallback(() => {
        if (!chatInput.trim()) return;
        socketRef.current.emit('chat', { message: chatInput.trim() });
        setChatInput('');
    }, [chatInput]);

    if (error) {
        return (
            <div></div>
        );
    }

    if (screen === 'lobby') {
        return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }

    if (screen === 'waiting') {
        return (
            <WaitingRoom
                roomId={roomID}
                players={roomInfo?.players || []}
                myPlayerId={playerId}
                onStart={handleStart}
            />
        );
    }

    if (screen === 'game' && gameState) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
                <GameTable
                    gameState={gameState}
                    myPlayerId={playerId}
                    selectedIds={selectedIds}
                    onCardClick={handleCardClick}
                    onPlay={handlePlay}
                    onPass={handlePass}
                    onNextHand={handleNextHand}
                />
                {/* Chat overlay */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    right: 0,
                    width: 260,
                    height: 200,
                    background: 'rgba(0,0,0,0.7)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                }}>
                    <div style={{ flex: 1, overflow: 'auto', padding: 8, fontSize: 12, fontFamily: 'Crimson Text, serif' }}>
                        {chatMessages.map((m, i) => (
                            <div key={i} style={{ marginBottom: 2 }}>
                                <span style={{ color: '#f39c12', fontWeight: 700 }}>{m.name}: </span>
                                <span style={{ color: '#ddd' }}>{m.message}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleChat()}
                            placeholder="Chat..."
                            style={{
                                flex: 1, padding: '6px 8px', background: 'transparent',
                                border: 'none', color: 'white', fontFamily: 'Crimson Text, serif', fontSize: 12, outline: 'none'
                            }}
                        />
                        <button onClick={handleChat} style={{
                            padding: '6px 10px', background: 'transparent', color: '#aaa',
                            border: 'none', cursor: 'pointer', fontSize: 12
                        }}>→</button>
                    </div>
                </div>
            </div>
        );

    }
    return <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontFamily: 'Cinzel, serif' }}>Loading...</div>
    </div>;

}

export default App
