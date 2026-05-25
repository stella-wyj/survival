import React, { useState } from 'react';

export function Lobby({ onCreateRoom, onJoinRoom }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [tab, setTab] = useState('create');

  const handleCreate = () => {
    if (!name.trim()) return alert('Enter your name');
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim()) return alert('Enter your name');
    if (!roomId.trim()) return alert('Enter room code');
    onJoinRoom(name.trim(), roomId.trim().toUpperCase());
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'radial-gradient(ellipse at center, #1b5e20 0%, #0a2e0a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Crimson Text, serif', position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 16, padding: '48px 56px', width: '90%', maxWidth: 400,
        textAlign: 'center', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>🃏</div>
        <h1 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 32, margin: '0 0 4px', letterSpacing: 3 }}>掼蛋</h1>
        <h2 style={{ color: '#aaa', fontFamily: 'Cinzel, serif', fontWeight: 400, fontSize: 16, margin: '0 0 32px', letterSpacing: 6 }}>GUANDAN</h2>

        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: 8, color: 'white', fontFamily: 'Crimson Text, serif',
            fontSize: 16, marginBottom: 16, boxSizing: 'border-box', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
          {['create', 'join'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px',
              background: tab === t ? 'rgba(212,175,55,0.2)' : 'transparent',
              color: tab === t ? '#d4af37' : '#777',
              border: 'none', fontFamily: 'Cinzel, serif', fontSize: 13,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {t === 'create' ? 'Create room' : 'Join room'}
            </button>
          ))}
        </div>

        {tab === 'join' && (
          <input
            placeholder="Room code (e.g. AB1C2D)"
            value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 8, color: 'white', fontFamily: 'Crimson Text, serif',
              fontSize: 16, marginBottom: 16, boxSizing: 'border-box', outline: 'none',
              textTransform: 'uppercase', letterSpacing: 2,
            }}
          />
        )}

        <button
          type="button"
          onClick={tab === 'create' ? handleCreate : handleJoin}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #c0392b, #922b21)',
            color: 'white', border: 'none', borderRadius: 8,
            fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 16,
            cursor: 'pointer', letterSpacing: 2, boxShadow: '0 4px 20px rgba(192,57,43,0.4)',
          }}
        >
          {tab === 'create' ? 'Create room' : 'Join game'}
        </button>

        <p style={{ color: '#555', fontSize: 13, marginTop: 24, lineHeight: 1.5 }}>
          Four-player partnership game. You can fill empty seats with AI bots.
        </p>
      </div>
    </div>
  );
}

export function WaitingRoom({ roomId, players, myPlayerId, onStart, onStartWithBots }) {
  const isHost = players[0]?.id === myPlayerId;
  const humanCount = players.filter(p => !p.isBot).length;
  const botCount = players.filter(p => p.isBot).length;
  const totalCount = players.length;
  const SEAT_LABELS = ['South', 'West', 'North', 'East'];
  const TEAM_COLORS = { 0: '#1565C0', 1: '#B71C1C' };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'radial-gradient(ellipse at center, #1b5e20 0%, #0a2e0a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Crimson Text, serif', position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 16, padding: '40px 48px', width: '90%', maxWidth: 440,
        backdropFilter: 'blur(10px)',
      }}>
        <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', textAlign: 'center', margin: '0 0 8px' }}>
          Waiting for players
        </h2>
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginBottom: 24 }}>
          Room code:{' '}
          <span style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 18, letterSpacing: 3 }}>
            {roomId || '—'}
          </span>
        </div>

        <div style={{ marginBottom: 24 }}>
          {[0, 1, 2, 3].map(seat => {
            const player = players.find(p => p.seat === seat);
            const team = seat % 2;
            return (
              <div key={seat} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: player ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 8, marginBottom: 8,
                border: `1px solid ${player ? `${TEAM_COLORS[team]}44` : 'rgba(255,255,255,0.05)'}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: player ? (player.isBot ? '#2e7d32' : TEAM_COLORS[team]) : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: player?.isBot ? 18 : 14, fontWeight: 700,
                }}>
                  {player ? (player.isBot ? (player.botEmoji || '🤖') : player.name[0].toUpperCase()) : seat + 1}
                </div>
                <div>
                  <div style={{ color: player ? 'white' : '#555', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {player ? player.name : 'Waiting…'}
                    {player?.id === myPlayerId && <span style={{ color: '#aaa', fontSize: 12 }}>(you)</span>}
                    {player?.isBot && (
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        background: 'rgba(46,125,50,0.4)', color: '#81c784', border: '1px solid #2e7d32',
                      }}>AI</span>
                    )}
                  </div>
                  <div style={{ color: TEAM_COLORS[team], fontSize: 11 }}>
                    Seat {seat + 1} · {SEAT_LABELS[seat]} · Team {team + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
          Seats 1 &amp; 3 vs seats 2 &amp; 4
        </div>

        {isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Play with bots button — fills remaining seats and starts */}
            {totalCount < 4 && (
              <button
                type="button"
                onClick={onStartWithBots}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                  color: 'white', border: '1px solid #2e7d32', borderRadius: 8,
                  fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', letterSpacing: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <span>🤖</span>
                Play with AI bots ({4 - totalCount} bot{4 - totalCount !== 1 ? 's' : ''})
              </button>
            )}

            {/* Start with all humans */}
            <button
              type="button"
              onClick={onStart}
              disabled={totalCount < 4}
              style={{
                width: '100%', padding: '14px',
                background: totalCount < 4 ? '#333' : 'linear-gradient(135deg, #c0392b, #922b21)',
                color: totalCount < 4 ? '#666' : 'white',
                border: 'none', borderRadius: 8,
                fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 15,
                cursor: totalCount < 4 ? 'not-allowed' : 'pointer', letterSpacing: 1,
              }}
            >
              {totalCount < 4 ? `Need ${4 - totalCount} more player${4 - totalCount !== 1 ? 's' : ''}` : 'Start game'}
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#777', fontSize: 14 }}>Waiting for host to start…</p>
        )}
      </div>
    </div>
  );
}