import React from 'react';
import { CardDisplay, Hand } from './Card';

const TEAM_COLORS = { 0: '#1565C0', 1: '#B71C1C' };
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function trickPlayFor(gameState, playerId) {
  const t = gameState.currentTrick || [];
  const row = t.find(x => x.playerId === playerId);
  if (!row) return null;
  if (row.pass) return { pass: true };
  return { cards: row.cards };
}

function PlayerZone({ player, isCurrentTurn, isSelf, myTeam, trickPlay, gameState }) {
  const team = player.seat % 2;
  const teamColor = TEAM_COLORS[team];
  const isFinished = gameState.finishOrder?.includes(player.id);
  const finishPos = (gameState.finishOrder || []).indexOf(player.id) + 1;
  const isBot = player.isBot;
  const isBotThinking = isCurrentTurn && isBot;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

      {/* Name tag */}
      <div style={{
        background: isCurrentTurn ? '#f39c12' : (isBot ? '#1b4332' : teamColor),
        color: 'white',
        padding: '4px 12px',
        borderRadius: 20,
        fontFamily: 'Cinzel, serif',
        fontSize: 13,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: isCurrentTurn ? '0 0 14px #f39c12' : (isBot ? '0 0 8px rgba(46,125,50,0.4)' : 'none'),
        transition: 'all 0.3s',
        border: isBot ? '1px solid rgba(129,199,132,0.3)' : 'none',
      }}>
        {isSelf && <span>👤</span>}
        {isBot && !isSelf && <span style={{ fontSize: 15 }}>{player.botEmoji || '🤖'}</span>}
        <span>{player.name}</span>
        {isBot && (
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(129,199,132,0.2)', color: '#81c784', border: '1px solid rgba(129,199,132,0.3)' }}>
            AI
          </span>
        )}
        {isFinished && (
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 10 }}>
            #{finishPos}
          </span>
        )}
        <span style={{ fontSize: 11, opacity: 0.75 }}>
          ({player.cardCount ?? player.cards?.length ?? 0})
        </span>
      </div>

      {/* "Thinking…" indicator for bots */}
      {isBotThinking && (
        <div style={{
          color: '#81c784', fontSize: 11, fontStyle: 'italic',
          fontFamily: 'Crimson Text, serif', letterSpacing: 1,
          animation: 'botThink 1.2s ease-in-out infinite',
        }}>
          thinking…
        </div>
      )}

      {/* Cards played in this trick */}
      {trickPlay ? (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {trickPlay.pass ? (
            <div style={{ color: '#777', fontFamily: 'Crimson Text, serif', fontSize: 15, fontStyle: 'italic' }}>
              Pass
            </div>
          ) : (
            (trickPlay.cards || []).map((card, i) => <CardDisplay key={i} card={card} small />)
          )}
        </div>
      ) : null}

      {/* Face-down card count for opponents */}
      {!isSelf && (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 160 }}>
          {Array.from({ length: Math.min(player.cardCount || 0, 8) }).map((_, i) => (
            <CardDisplay key={i} card={{ hidden: true }} small />
          ))}
          {(player.cardCount || 0) > 8 && (
            <span style={{ color: '#aaa', alignSelf: 'center', fontSize: 12 }}>+{(player.cardCount || 0) - 8}</span>
          )}
        </div>
      )}
    </div>
  );
}

function HandEndOverlay({ result, gameState, myTeam, onNextHand }) {
  const winnerTeamName = result.winnerTeam === 0 ? 'Team ♦' : 'Team ♥';
  const youWon = result.winnerTeam === myTeam;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: `2px solid ${youWon ? '#d4af37' : '#555'}`,
        borderRadius: 16, padding: '40px 60px', textAlign: 'center', fontFamily: 'Cinzel, serif',
        minWidth: 280,
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

export function GameTable({ gameState, myPlayerId, selectedIds, onCardClick, onPlay, onPass, onNextHand }) {
  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === myPlayerId);
  if (!me) {
    return (
      <div style={{ color: 'white', padding: 24, fontFamily: 'system-ui' }}>
        Could not find your seat. Try rejoining the room.
      </div>
    );
  }

  const mySeat = me.seat;
  const myTeam = mySeat % 2;
  const levelRank = RANKS[(gameState.atkLevel || 2) - 2];
  const isMyTurn = gameState.currentTurn === myPlayerId;
  const canPass = isMyTurn && !!gameState.lastPlay;

  // Relative player positions (counterclockwise layout):
  // p0 = self (bottom), p2 = opposite (top), p3 = left, p1 = right
  const relSeats = [0, 1, 2, 3].map(offset => (mySeat + offset * 3 + 4) % 4);
  const [p0, p1, p2, p3] = relSeats.map(seat => gameState.players.find(p => p.seat === seat));

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, #0d2818 0%, #061208 100%)',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto auto',
      gridTemplateColumns: '1fr 2fr 1fr',
      gap: 0,
      boxSizing: 'border-box',
      color: '#eee',
      fontFamily: 'Crimson Text, serif',
      overflow: 'hidden',
      position: 'fixed',
      top: 0, left: 0,
    }}>

      {/* ── Header bar ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: 1,
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', fontSize: 12,
      }}>
        <div style={{ color: TEAM_COLORS[0], fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
          Team ♦ — Level {RANKS[(gameState.level?.[0] || 2) - 2]}
        </div>
        <div style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15, textAlign: 'center' }}>
          掼蛋 · Level <span style={{ color: '#f39c12' }}>{levelRank}</span>
          <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>Hand #{gameState.handNumber}</span>
        </div>
        <div style={{ color: TEAM_COLORS[1], fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
          Team ♥ — Level {RANKS[(gameState.level?.[1] || 2) - 2]}
        </div>
      </div>

      {/* ── Top player (opposite) ── */}
      <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 12 }}>
        {p2 && <PlayerZone player={p2} isCurrentTurn={gameState.currentTurn === p2.id} isSelf={false} myTeam={myTeam} trickPlay={trickPlayFor(gameState, p2.id)} gameState={gameState} />}
      </div>

      {/* ── Left player ── */}
      <div style={{ gridColumn: 1, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        {p3 && <PlayerZone player={p3} isCurrentTurn={gameState.currentTurn === p3.id} isSelf={false} myTeam={myTeam} trickPlay={trickPlayFor(gameState, p3.id)} gameState={gameState} />}
      </div>

      {/* ── Centre trick info ── */}
      <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          {gameState.lastPlay ? (
            <div style={{ color: '#555', fontSize: 11, fontStyle: 'italic' }}>
              {gameState.players.find(p => p.id === gameState.lastPlay.playerId)?.name} played {gameState.lastPlay.combo?.type}
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, fontStyle: 'italic' }}>lead the trick</div>
          )}
          {isMyTurn && <div style={{ color: '#f39c12', fontSize: 12, marginTop: 6, fontFamily: 'Cinzel, serif', animation: 'botThink 1s ease-in-out infinite' }}>▼ your turn</div>}
        </div>
      </div>

      {/* ── Right player ── */}
      <div style={{ gridColumn: 3, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        {p1 && <PlayerZone player={p1} isCurrentTurn={gameState.currentTurn === p1.id} isSelf={false} myTeam={myTeam} trickPlay={trickPlayFor(gameState, p1.id)} gameState={gameState} />}
      </div>

      {/* ── My hand ── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: 3,
        borderTop: `2px solid ${TEAM_COLORS[myTeam]}`,
        background: 'rgba(0,0,0,0.4)', padding: '8px 8px 4px',
      }}>
        <div style={{ textAlign: 'center', color: '#666', fontSize: 11, marginBottom: 2 }}>
          {me.name} — {(me.cards || []).length} cards
          {isMyTurn && <span style={{ color: '#f39c12', marginLeft: 8, fontWeight: 700 }}>● Your turn</span>}
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
        display: 'flex', justifyContent: 'center', gap: 12,
        padding: '8px 12px 12px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <button type="button" onClick={onPass} disabled={!canPass} style={{
          padding: '10px 28px', borderRadius: 8, border: '1px solid #444',
          background: canPass ? '#2a2a2a' : '#1a1a1a',
          color: canPass ? '#bbb' : '#444',
          cursor: canPass ? 'pointer' : 'not-allowed',
          fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14,
          transition: 'all 0.15s',
        }}>
          Pass
        </button>
        <button type="button" onClick={onPlay} disabled={!isMyTurn || !selectedIds?.size} style={{
          padding: '10px 32px', borderRadius: 8, border: 'none',
          background: (isMyTurn && selectedIds?.size) ? '#c0392b' : '#3a1a1a',
          color: (isMyTurn && selectedIds?.size) ? '#fff' : '#553333',
          cursor: (isMyTurn && selectedIds?.size) ? 'pointer' : 'not-allowed',
          fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14,
          boxShadow: (isMyTurn && selectedIds?.size) ? '0 0 16px rgba(192,57,43,0.4)' : 'none',
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
        @keyframes botThink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}