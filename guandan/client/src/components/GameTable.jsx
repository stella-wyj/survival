import React from 'react';
import { CardDisplay, Hand } from './Card';

const TEAM_COLORS = {
  0: '#1565C0',
  1: '#B71C1C',
};

function trickPlayFor(gameState, playerId) {
  const t = gameState.currentTrick || [];
  const row = t.find((x) => x.playerId === playerId);
  if (!row) return null;
  if (row.pass) return { pass: true };
  return { cards: row.cards };
}

function PlayerZone({ player, isCurrentTurn, isSelf, myTeam, trickPlay, gameState }) {
  const team = player.seat % 2;
  const teamColor = TEAM_COLORS[team];
  const isFinished = gameState.finishOrder?.includes(player.id);
  const finishPos = (gameState.finishOrder || []).indexOf(player.id) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          background: isCurrentTurn ? '#f39c12' : teamColor,
          color: 'white',
          padding: '4px 12px',
          borderRadius: 20,
          fontFamily: 'Cinzel, serif',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: isCurrentTurn ? '0 0 12px #f39c12' : 'none',
        }}
      >
        {isSelf && '👤 '}
        {player.name}
        {isFinished ? (
          <span
            style={{
              fontSize: 11,
              background: 'rgba(255,255,255,0.2)',
              padding: '1px 6px',
              borderRadius: 10,
            }}
          >
            #{finishPos}
          </span>
        ) : null}
        <span style={{ fontSize: 11, opacity: 0.8 }}>({player.cardCount ?? player.cards?.length ?? 0} cards)</span>
      </div>

      {trickPlay ? (
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {trickPlay.pass ? (
            <div
              style={{
                color: '#aaa',
                fontFamily: 'Crimson Text, serif',
                fontSize: 16,
                fontStyle: 'italic',
              }}
            >
              Pass
            </div>
          ) : (
            (trickPlay.cards || []).map((card, i) => <CardDisplay key={i} card={card} small />)
          )}
        </div>
      ) : null}

      {!isSelf ? (
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: Math.min(player.cardCount || 0, 10) }).map((_, i) => (
            <CardDisplay key={i} card={{ hidden: true }} small />
          ))}
          {(player.cardCount || 0) > 10 ? (
            <span style={{ color: '#aaa', alignSelf: 'center' }}>+{(player.cardCount || 0) - 10}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HandEndOverlay({ result, gameState, myTeam, onNextHand }) {
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const winnerTeamName = result.winnerTeam === 0 ? 'Team ♦' : 'Team ♥';
  const youWon = result.winnerTeam === myTeam;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: `2px solid ${youWon ? '#d4af37' : '#555'}`,
          borderRadius: 16,
          padding: '40px 60px',
          textAlign: 'center',
          fontFamily: 'Cinzel, serif',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>{youWon ? '🏆' : '😤'}</div>
        <div style={{ color: '#d4af37', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{winnerTeamName} wins</div>
        <div style={{ color: '#aaa', fontSize: 16, marginBottom: 8 }}>
          Result: <span style={{ color: 'white' }}>{result.winType}</span>
        </div>
        <div style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>
          Levels: ♦ {RANKS[(gameState.level?.[0] || 2) - 2]} · ♥ {RANKS[(gameState.level?.[1] || 2) - 2]}
        </div>
        <button
          type="button"
          onClick={onNextHand}
          style={{
            background: '#d4af37',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
      }}
    >
      <div style={{ color: youWon ? '#d4af37' : '#888', fontFamily: 'Cinzel, serif', fontSize: 28, textAlign: 'center' }}>
        {youWon ? 'You win!' : 'Game over'}
        <div style={{ color: '#aaa', fontSize: 18, marginTop: 12 }}>{winnerTeamName}</div>
      </div>
    </div>
  );
}

export function GameTable({ gameState, myPlayerId, selectedIds, onCardClick, onPlay, onPass, onNextHand }) {
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  if (!me) {
    return (
      <div style={{ color: 'white', padding: 24, fontFamily: 'system-ui' }}>
        Could not find your seat. Try rejoining the room.
      </div>
    );
  }

  const mySeat = me.seat;
  const myTeam = mySeat % 2;
  const relativeSeats = [0, 1, 2, 3].map((offset) => (mySeat + offset * 3 + 4) % 4);
  const playersByRel = relativeSeats.map((seat) => gameState.players.find((p) => p.seat === seat)).filter(Boolean);
  const isMyTurn = gameState.currentTurn === myPlayerId;

  const [p0, p1, p2, p3] = [playersByRel[0], playersByRel[1], playersByRel[2], playersByRel[3]];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at center, #0d2818 0%, #061208 100%)',
        display: 'grid',
        gridTemplateRows: '1fr auto auto',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: 8,
        padding: 12,
        boxSizing: 'border-box',
        color: '#eee',
        fontFamily: 'Crimson Text, serif',
      }}
    >
      <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {p2 ? (
          <PlayerZone
            player={p2}
            isCurrentTurn={gameState.currentTurn === p2.id}
            isSelf={false}
            myTeam={myTeam}
            trickPlay={trickPlayFor(gameState, p2.id)}
            gameState={gameState}
          />
        ) : null}
      </div>

      <div style={{ gridColumn: 1, gridRow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p3 ? (
          <PlayerZone
            player={p3}
            isCurrentTurn={gameState.currentTurn === p3.id}
            isSelf={false}
            myTeam={myTeam}
            trickPlay={trickPlayFor(gameState, p3.id)}
            gameState={gameState}
          />
        ) : null}
      </div>

      <div style={{ gridColumn: 3, gridRow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p1 ? (
          <PlayerZone
            player={p1}
            isCurrentTurn={gameState.currentTurn === p1.id}
            isSelf={false}
            myTeam={myTeam}
            trickPlay={trickPlayFor(gameState, p1.id)}
            gameState={gameState}
          />
        ) : null}
      </div>

      <div
        style={{
          gridColumn: '1 / -1',
          gridRow: 2,
          borderTop: `2px solid ${TEAM_COLORS[myTeam]}`,
          background: 'rgba(0,0,0,0.35)',
          padding: 8,
        }}
      >
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: 11, marginBottom: 4 }}>
          {me.name} — {(me.cards || []).length} cards
          {isMyTurn ? <span style={{ color: '#f39c12', marginLeft: 8 }}>● Your turn</span> : null}
        </div>
        <Hand
          cards={me.cards || []}
          selectedIds={selectedIds}
          onCardClick={isMyTurn ? onCardClick : null}
          isCurrentPlayer={isMyTurn}
        />
      </div>

      <div
        style={{
          gridColumn: '1 / -1',
          gridRow: 3,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          paddingBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={onPass}
          disabled={!isMyTurn}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: '1px solid #555',
            background: isMyTurn ? '#333' : '#222',
            color: isMyTurn ? '#fff' : '#666',
            cursor: isMyTurn ? 'pointer' : 'not-allowed',
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
          }}
        >
          Pass
        </button>
        <button
          type="button"
          onClick={onPlay}
          disabled={!isMyTurn}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: isMyTurn ? '#c0392b' : '#444',
            color: '#fff',
            cursor: isMyTurn ? 'pointer' : 'not-allowed',
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
          }}
        >
          Play
        </button>
      </div>

      {gameState.phase === 'handEnd' && gameState.handResult ? (
        <HandEndOverlay result={gameState.handResult} gameState={gameState} myTeam={myTeam} onNextHand={onNextHand} />
      ) : null}
      {gameState.phase === 'gameEnd' ? <GameEndOverlay winner={gameState.winner} myTeam={myTeam} /> : null}
    </div>
  );
}
