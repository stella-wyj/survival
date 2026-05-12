import React, { useState } from 'react';

export function Lobby ({ onCreateRoom, onJoinRoom }){
    const [name, setName] = useState('');
    const [roomId, setRoomid] = useState('');
    const [tab, setTab] = useState('create');

    const handleCreate = () => {
        if (!name.trim()) return alert('Enter your name');
        if (!roomId.trim()) return alert('Enter your room code');
        onJoinRoom(name.trim(), roomId.Id.trim().toUpperCase());
    };

    return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at center, #1b5e20 0%, #0a2e0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Crimson Text, serif',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 16,
        padding: '48px 56px',
        width: '90%',
        maxWidth: 400,
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>🃏</div>
        <h1 style={{
          color: '#d4af37',
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: 32,
          margin: '0 0 4px',
          letterSpacing: 3,
        }}>掼蛋</h1>
        <h2 style={{
          color: '#aaa',
          fontFamily: 'Cinzel, serif',
          fontWeight: 400,
          fontSize: 16,
          margin: '0 0 32px',
          letterSpacing: 6,
        }}>GUANDAN</h2>

        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: 8,
            color: 'white',
            fontFamily: 'Crimson Text, serif',
            fontSize: 16,
            marginBottom: 16,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
          {['create', 'join'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: '10px',
              background: tab === t ? 'rgba(212,175,55,0.2)' : 'transparent',
              color: tab === t ? '#d4af37' : '#777',
              border: 'none',
              fontFamily: 'Cinzel, serif',
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {tab === 'join' && (
          <input
            placeholder="Room code (e.g. AB1C2D)"
            value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 8,
              color: 'white',
              fontFamily: 'Crimson Text, serif',
              fontSize: 16,
              marginBottom: 16,
              boxSizing: 'border-box',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          />
        )}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #c0392b, #922b21)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            letterSpacing: 2,
            boxShadow: '0 4px 20px rgba(192,57,43,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {tab === 'create' ? 'CREATE ROOM' : 'JOIN GAME'}
        </button>

        <p style={{ color: '#555', fontSize: 13, marginTop: 24, lineHeight: 1.5 }}>
          A 4-player partnership card game from China.<br/>
          Need 4 players to start.
        </p>
      </div>
    </div>
  );
}

export function WaitingRoom({ roomId, players, myPlayerId, onStart}){
    const me = players.find(p => p.id === myPlayerId);
    const isHost = players[0]?.id === myPlayerId;

    const SEAT_LABELS = ['South', 'West', 'North', 'East'];
    const TEAM_COLORS = { 0: '#11878e', 1: '#ae1426'} 
    
    
}