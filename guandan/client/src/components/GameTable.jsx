import React, { useState, useEffect, useRef } from 'react';
import { CardDisplay, Hand } from './Card';

const TEAM_COLORS = { 0: '#1565C0', 1: '#B71C1C' };
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// Shows the most recently played cards in the center of the table. ????????? 

function CenterTrick({ gameState, players }) {
  const lastPlay = gameState.lastPlay;
  const [displayPlay, setDisplayPlay] = useState(null);
  const [leadLabel, setLeadLabel] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lastPlay) {
      // Trick was cleared, don't wipe instantly, let linger timer run out
      return;
    }

    const player = players.find(p => p.id === lastPlay.playerId);
    const isBot = player?.isBot;
    const trickEntry = gameState.currentTrick?.findLast(t => t.playerId === lastPlay.playerId && !t.pass);

    const newDisplay = {
      cards: trickEntry.cards || [],
      combo: lastPlay.combo,
      playerName: player?.name || '?',
      isBot,
      team: player ? player.seat % 2 : 0,
    };

    setDisplayPlay(newDisplay);
    setLeadLabel(`${player?.name} — ${lastPlay.combo?.type || ''}`);

    // Clear any existing linger timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Bots: hold for 10s; humans: hold for 3s
    const lingerMs = isBot ? 5000 : 3000;
    timerRef.current = setTimeout(() => {
      // Only clear if trick was already won (lastPlay still same means it wasn't beaten)
      setDisplayPlay(prev => prev);
    }, lingerMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastPlay?.playerId, lastPlay?.combo?.rank, lastPlay?.combo?.type]);

  // When trick resets (new trick starts), fade out after a beat
  useEffect(() => {
    if (!lastPlay && displayPlay) {
      timerRef.current = setTimeout(() => setDisplayPlay(null), 800);
    }
  }, [lastPlay]);

  if (!displayPlay) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
      }}>
        <div style={{
          color: 'rgba(255,255,255,0.08)', fontSize: 14,
          fontStyle: 'italic', fontFamily: 'Cinzel, serif', letterSpacing: 2,
        }}>
          lead the trick
        </div>
      </div>
    );
  }

  const borderColor = TEAM_COLORS[displayPlay.team];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', gap: 8,
    }}>
      {/* Label */}
      <div style={{
        color: borderColor, fontSize: 11, fontFamily: 'Cinzel, serif',
        fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.5)', padding: '2px 10px', borderRadius: 10,
        border: `1px solid ${borderColor}44`,
      }}>
        {displayPlay.playerName} · {displayPlay.combo?.type}
      </div>

      {/* Cards fanned in center */}
      <div style={{
        display: 'flex', gap: -4, justifyContent: 'center',
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 12,
        border: `1px solid ${borderColor}55`,
        boxShadow: `0 0 20px ${borderColor}33`,
        flexWrap: 'wrap',
        maxWidth: 320,
      }}>
        {displayPlay.cards.map((card, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: i }}>
            <CardDisplay card={card} small={displayPlay.cards.length > 6} />
          </div>
        ))}
      </div>

    </div>
  );
}

function BotLingerBar({ duration }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: '#81c784', borderRadius: 2,
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

// ─── Player status badge ──────────────────────────────────────────────────────

function PlayerStatus({ player, isCurrentTurn, gameState }) {
  const isFinished = gameState.finishOrder?.includes(player.id);
  const finishPos = (gameState.finishOrder || []).indexOf(player.id) + 1;
  const isBot = player.isBot;

  // Check if this player passed in the current trick
  const hasPassed = gameState.currentTrick?.some(t => t.playerId === player.id && t.pass);

  // Who has the current highest play (i.e. lastPlay belongs to this player)
  const isLeading = gameState.lastPlay?.playerId === player.id;

  const team = player.seat % 2;
  const teamColor = TEAM_COLORS[team];

  let bg = isBot ? '#1b4332' : teamColor;
  let glow = 'none';

  if (isCurrentTurn) {
    bg = '#b8860b';
    glow = '0 0 14px #f39c12, 0 0 28px #f39c1244';
  } else if (isLeading) {
    bg = isBot ? '#1a3a1a' : teamColor;
    glow = `0 0 12px ${teamColor}88`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {/* Name pill */}
      <div style={{
        background: bg,
        color: 'white',
        padding: '4px 10px',
        borderRadius: 20,
        fontFamily: 'Cinzel, serif',
        fontSize: 12,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        boxShadow: glow,
        border: isLeading && !isCurrentTurn ? `1px solid ${teamColor}` : (isBot ? '1px solid rgba(129,199,132,0.3)' : 'none'),
        transition: 'all 0.3s',
        position: 'relative',
      }}>
        {isBot && <span style={{ fontSize: 14 }}>{player.botEmoji || '🤖'}</span>}
        <span>{player.name}</span>
        {isBot && (
          <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 6, background: 'rgba(129,199,132,0.2)', color: '#81c784' }}>AI</span>
        )}
        {isFinished && (
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 8 }}>#{finishPos}</span>
        )}
        {isLeading && !isCurrentTurn && !isFinished && (
          <span style={{ fontSize: 10, color: '#f39c12' }}>♛</span>
        )}
        <span style={{ fontSize: 10, opacity: 0.7 }}>({player.cardCount ?? 0})</span>
      </div>

      {/* Status row: PASS badge or thinking */}
      <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasPassed && (
          <div style={{
            background: 'rgba(100,100,100,0.4)',
            border: '1px solid #555',
            color: '#888', fontSize: 10,
            padding: '1px 8px', borderRadius: 10,
            fontFamily: 'Cinzel, serif', letterSpacing: 1,
          }}>
            PASS
          </div>
        )}
        {isCurrentTurn && isBot && (
          <div style={{
            color: '#81c784', fontSize: 10, fontStyle: 'italic',
            fontFamily: 'Crimson Text, serif', letterSpacing: 1,
            animation: 'pulse 1.2s ease-in-out infinite',
          }}>
            thinking…
          </div>
        )}
        {isCurrentTurn && !isBot && (
          <div style={{
            color: '#f39c12', fontSize: 10,
            fontFamily: 'Cinzel, serif', letterSpacing: 1,
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            ● YOUR TURN
          </div>
        )}
      </div>

      {/* Face-down cards for opponents */}
      {!isFinished && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', maxWidth: 180, gap: 2 }}>
          {Array.from({ length: Math.min(player.cardCount || 0, 7) }).map((_, i) => (
            <CardDisplay key={i} card={{ hidden: true }} small />
          ))}
          {(player.cardCount || 0) > 7 && (
            <span style={{ color: '#666', alignSelf: 'center', fontSize: 11 }}>+{(player.cardCount || 0) - 7}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

function HandEndOverlay({ result, gameState, myTeam, onNextHand }) {
  const winnerTeamName = result.winnerTeam === 0 ? 'Team ♦' : 'Team ♥';
  const youWon = result.winnerTeam === myTeam;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: `2px solid ${youWon ? '#d4af37' : '#555'}`,
        borderRadius: 16, padding: '40px 60px', textAlign: 'center',
        fontFamily: 'Cinzel, serif', minWidth: 280,
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{youWon ? '🏆' : '😤'}</div>
        <div style={{ color: '#d4af37', fontSize: 26, fontWeight: 900, marginBottom: 8 }}>{winnerTeamName} wins</div>
        <div style={{ color: '#aaa', fontSize: 15, marginBottom: 8 }}>
          Result: <span style={{ color: 'white' }}>{result.winType}</span>
          {'  '}(+{result.promotion} level{result.promotion !== 1 ? 's' : ''})
        </div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
          Levels: ♦ {RANKS[(gameState.level?.[0] || 2) - 2]} · ♥ {RANKS[(gameState.level?.[1] || 2) - 2]}
        </div>
        <button type="button" onClick={onNextHand} style={{
          background: '#d4af37', color: '#1a1a2e', border: 'none', borderRadius: 8,
          padding: '12px 32px', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 16, cursor: 'pointer',
        }}>
          Next hand →
        </button>
      </div>
    </div>
  );
}

function GameEndOverlay({ winner, myTeam }) {
  const winnerTeamName = winner === 0 ? 'Team ♦' : 'Team ♥';
  const youWon = winner === myTeam;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
      <div style={{ fontFamily: 'Cinzel, serif', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{youWon ? '🎉' : '🎭'}</div>
        <div style={{ color: youWon ? '#d4af37' : '#888', fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
          {youWon ? 'Victory!' : 'Game Over'}
        </div>
        <div style={{ color: '#aaa', fontSize: 18 }}>{winnerTeamName} wins the game</div>
      </div>
    </div>
  );
}

// ─── Main GameTable ───────────────────────────────────────────────────────────

export function GameTable({ gameState, myPlayerId, selectedIds, onCardClick, onPlay, onPass, onNextHand }) {
  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === myPlayerId);
  if (!me) {
    return <div style={{ color: 'white', padding: 24 }}>Could not find your seat. Try rejoining.</div>;
  }

  const mySeat = me.seat;
  const myTeam = mySeat % 2;
  const levelRank = RANKS[(gameState.atkLevel || 2) - 2];
  const isMyTurn = gameState.currentTurn === myPlayerId;
  const canPass = isMyTurn && !!gameState.lastPlay;

  // Relative seats: p0=self(bottom), p1=right, p2=top(opposite), p3=left
  const relSeats = [0, 1, 2, 3].map(offset => (mySeat + offset * 3 + 4) % 4);
  const [p0, p1, p2, p3] = relSeats.map(seat => gameState.players.find(p => p.seat === seat));

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, #0d2818 0%, #061208 100%)',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto auto',
      gridTemplateColumns: '200px 1fr 200px',
      boxSizing: 'border-box',
      color: '#eee',
      fontFamily: 'Crimson Text, serif',
      overflow: 'hidden',
      position: 'fixed',
      top: 0, left: 0,
    }}>

      {/* ── Header ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: 1,
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px',
      }}>
        <div style={{ color: TEAM_COLORS[0], fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13 }}>
          Team ♦ — Level {RANKS[(gameState.level?.[0] || 2) - 2]}
        </div>
        <div style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15, textAlign: 'center' }}>
          掼蛋 · Level <span style={{ color: '#f39c12' }}>{levelRank}</span>
          <span style={{ color: '#444', fontSize: 11, marginLeft: 10 }}>Hand #{gameState.handNumber}</span>
        </div>
        <div style={{ color: TEAM_COLORS[1], fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13 }}>
          Team ♥ — Level {RANKS[(gameState.level?.[1] || 2) - 2]}
        </div>
      </div>

      {/* ── Left player ── */}
      <div style={{ gridColumn: 1, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        {p3 && (
          <PlayerStatus
            player={p3}
            isCurrentTurn={gameState.currentTurn === p3.id}
            gameState={gameState}
          />
        )}
      </div>

      {/* ── Centre column: top player + trick + bottom space ── */}
      <div style={{
        gridColumn: 2, gridRow: 2,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: 0,
      }}>
        {/* Top player */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          {p2 && (
            <PlayerStatus
              player={p2}
              isCurrentTurn={gameState.currentTurn === p2.id}
              gameState={gameState}
            />
          )}
        </div>

        {/* Center trick area — the felt oval */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Felt oval */}
          <div style={{
            width: '80%', maxWidth: 400, height: 200,
            background: 'radial-gradient(ellipse, rgba(0,60,20,0.6) 0%, rgba(0,30,10,0.3) 100%)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CenterTrick gameState={gameState} players={gameState.players} />
          </div>
        </div>
      </div>

      {/* ── Right player ── */}
      <div style={{ gridColumn: 3, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        {p1 && (
          <PlayerStatus
            player={p1}
            isCurrentTurn={gameState.currentTurn === p1.id}
            gameState={gameState}
          />
        )}
      </div>

      {/* ── My hand ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: 3,
        borderTop: `2px solid ${TEAM_COLORS[myTeam]}44`,
        background: 'rgba(0,0,0,0.45)',
        paddingTop: 4,
      }}>
        <div style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 0 }}>
          <span style={{ color: TEAM_COLORS[myTeam], fontWeight: 700, fontFamily: 'Cinzel, serif' }}>{me.name}</span>
          <span style={{ marginLeft: 8 }}>{(me.cards || []).length} cards</span>
          {isMyTurn && (
            <span style={{
              color: '#f39c12', marginLeft: 10, fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 11,
              animation: 'pulse 1s ease-in-out infinite',
            }}>
              ● YOUR TURN
            </span>
          )}
        </div>
        <Hand
          cards={me.cards || []}
          selectedIds={selectedIds}
          onCardClick={isMyTurn ? onCardClick : null}
          isCurrentPlayer={isMyTurn}
        />
      </div>

      {/* ── Action buttons ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: 4,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
        padding: '8px 12px 14px',
        background: 'rgba(0,0,0,0.4)',
      }}>
        <button type="button" onClick={onPass} disabled={!canPass} style={{
          padding: '10px 32px', borderRadius: 8,
          border: canPass ? '1px solid #555' : '1px solid #2a2a2a',
          background: canPass ? '#252525' : '#141414',
          color: canPass ? '#bbb' : '#383838',
          cursor: canPass ? 'pointer' : 'not-allowed',
          fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14,
          transition: 'all 0.15s',
        }}>
          Pass
        </button>
        <button type="button" onClick={onPlay} disabled={!isMyTurn || !selectedIds?.size} style={{
          padding: '10px 40px', borderRadius: 8, border: 'none',
          background: (isMyTurn && selectedIds?.size) ? '#c0392b' : '#2a1010',
          color: (isMyTurn && selectedIds?.size) ? '#fff' : '#4a2020',
          cursor: (isMyTurn && selectedIds?.size) ? 'pointer' : 'not-allowed',
          fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14,
          boxShadow: (isMyTurn && selectedIds?.size) ? '0 0 18px rgba(192,57,43,0.5)' : 'none',
          transition: 'all 0.15s',
        }}>
          Play {selectedIds?.size ? `(${selectedIds.size})` : ''}
        </button>
      </div>

      {/* ── Overlays ── */}
      {gameState.phase === 'handEnd' && gameState.handResult && (
        <HandEndOverlay result={gameState.handResult} gameState={gameState} myTeam={myTeam} onNextHand={onNextHand} />
      )}
      {gameState.phase === 'gameEnd' && (
        <GameEndOverlay winner={gameState.winner} myTeam={myTeam} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}