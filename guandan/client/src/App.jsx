import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Lobby, WaitingRoom } from './components/Lobby';
import { GameTable } from './components/GameTable';

const SERVER_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';

function App() {
  const socketRef = useRef(null);
  const [screen, setScreen] = useState('lobby');
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState(null);
  // const [chatMessages, setChatMessages] = useState([]);
  // const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('roomUpdate', info => {
      setRoomInfo(info);
      if (info.status === 'playing') setScreen('game');
    });

    socket.on('gameState', state => {
      setGameState(state);
      setSelectedIds(new Set());
    });

    // socket.on('chat', msg => {
    //   setChatMessages(prev => [...prev.slice(-60), msg]);
    // });

    socket.on('playerLeft', ({ playerId: pid }) => {
      console.log('Player left:', pid);
    });

    socket.on('connect_error', () => {
      setError('Cannot connect to server.');
    });

    return () => socket.disconnect();
  }, []);

  const handleCreateRoom = useCallback(name => {
    socketRef.current.emit('createRoom', { name }, ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen('waiting');
    });
  }, []);

  const handleJoinRoom = useCallback((name, rid) => {
    socketRef.current.emit('joinRoom', { roomId: rid, name }, res => {
      if (res.error) return setError(res.error);
      setRoomId(rid);
      setPlayerId(res.playerId);
      setScreen('waiting');
    });
  }, []);

  const handleStart = useCallback(() => {
    socketRef.current.emit('startGame');
  }, []);

  const handleStartWithBots = useCallback(() => {
    socketRef.current.emit('startWithBots');
  }, []);

  const handleCardClick = useCallback(card => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(card.id) ? next.delete(card.id) : next.add(card.id);
      return next;
    });
  }, []);

  const handlePlay = useCallback(() => {
    if (!gameState || selectedIds.size === 0) return;
    const me = gameState.players.find(p => p.id === playerId);
    if (!me) return;
    const cards = me.cards.filter(c => selectedIds.has(c.id));
    socketRef.current.emit('playCards', { cards }, res => {
      if (res?.error) setError(res.error);
      else setSelectedIds(new Set());
    });
  }, [gameState, selectedIds, playerId]);

  const handlePass = useCallback(() => {
    socketRef.current.emit('pass', res => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleNextHand = useCallback(() => {
    socketRef.current.emit('nextHand');
  }, []);

  // const handleChat = useCallback(() => {
  //   if (!chatInput.trim()) return;
  //   socketRef.current.emit('chat', { message: chatInput.trim() });
  //   setChatInput('');
  // }, [chatInput]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
        position: 'fixed', top: 0, left: 0,
      }}>
        <div style={{ color: '#c0392b', fontFamily: 'Cinzel, serif', fontSize: 18, maxWidth: 400, textAlign: 'center' }}>
          ⚠ {error}
        </div>
        <button onClick={() => setError(null)} style={{
          background: '#c0392b', color: 'white', border: 'none', borderRadius: 8,
          padding: '8px 20px', cursor: 'pointer', fontFamily: 'Cinzel, serif',
        }}>Dismiss</button>
      </div>
    );
  }

  if (screen === 'lobby') {
    return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (screen === 'waiting') {
    return (
      <WaitingRoom
        roomId={roomId}
        players={roomInfo?.players || []}
        myPlayerId={playerId}
        onStart={handleStart}
        onStartWithBots={handleStartWithBots}
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

        {/* Chat panel
        <div style={{
          position: 'fixed', bottom: 0, right: 0, width: 280, height: 220,
          background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex',
          flexDirection: 'column', zIndex: 50, borderTopLeftRadius: 8,
        }}>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#555', fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>
            CHAT
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 8px' }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ marginBottom: 4, fontSize: 12, fontFamily: 'Crimson Text, serif', lineHeight: 1.4 }}>
                <span style={{ color: m.isBot ? '#81c784' : '#f39c12', fontWeight: 700 }}>
                  {m.name}:
                </span>{' '}
                <span style={{ color: '#ddd' }}>{m.message}</span>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div style={{ color: '#444', fontSize: 11, fontStyle: 'italic', padding: '4px 0' }}>No messages yet…</div>
            )}
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
              placeholder="Say something…"
              style={{
                flex: 1, padding: '7px 8px', background: 'transparent',
                border: 'none', color: 'white', fontFamily: 'Crimson Text, serif',
                fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={handleChat} style={{
              padding: '7px 10px', background: 'transparent', color: '#777',
              border: 'none', cursor: 'pointer', fontSize: 14,
            }}>→</button>
          </div>
        </div>  */}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', background: '#061208',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{ color: '#555', fontFamily: 'Cinzel, serif' }}>Loading…</div>
    </div>
  );
}

export default App;