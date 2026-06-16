import React from 'react';

const SUIT_SYMBOLS = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣', joker: '★',
  S: '♠', H: '♥', D: '♦', C: '♣',
};
const SUIT_COLORS = {
  spades: '#1a1a2e', hearts: '#c0392b', diamonds: '#c0392b', clubs: '#1a1a2e', joker: '#8B0000',
  S: '#1a1a2e', H: '#c0392b', D: '#c0392b', C: '#c0392b',
};

export function CardDisplay({ card, selected, onClick, small, faceDown }) {
  if (!card || card.hidden || faceDown) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)',
        borderRadius: small ? 5 : 8,
        border: '2px solid #3949ab',
        width: small ? 36 : 64,
        height: small ? 54 : 90,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#5c6bc0', fontSize: small ? 14 : 20 }}>🂠</span>
      </div>
    );
  }

  const isJoker = card.suit === 'joker';
  const color = isJoker ? (card.rank === 'RJ' ? '#c0392b' : '#1a1a2e') : (SUIT_COLORS[card.suit] || '#333');
  const symbol = SUIT_SYMBOLS[card.suit] || '?';
  const displayRank = isJoker ? 'Joker' : card.rank;
  const displaySymbol = isJoker ? '★' : symbol;

  return (
    <div
      onClick={onClick}
      style={{
        width: small ? 36 : 64,
        height: small ? 54 : 90,
        background: selected ? '#fffde7' : 'white',
        borderRadius: small ? 5 : 8,
        border: selected ? '2px solid #f39c12' : '2px solid #ddd',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: small ? '2px 3px' : '4px 6px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected
          ? '0 -8px 0 0 #f39c12, 2px 2px 8px rgba(0,0,0,0.4)'
          : '2px 2px 6px rgba(0,0,0,0.2)',
        transform: selected ? 'translateY(-10px)' : 'none',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        flexShrink: 0,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div style={{ color, fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: small ? 8 : 12, lineHeight: 1 }}>
        {displayRank}
        <div style={{ fontSize: small ? 7 : 10 }}>{displaySymbol}</div>
      </div>
      {!small && (
        <div style={{ color, fontSize: isJoker ? 22 : 28, lineHeight: 1, alignSelf: 'center', fontFamily: 'serif' }}>
          {displaySymbol}
        </div>
      )}
      <div style={{
        color, fontFamily: 'Cinzel, serif', fontWeight: 700,
        fontSize: small ? 8 : 12, lineHeight: 1,
        transform: 'rotate(180deg)', alignSelf: 'flex-end',
      }}>
        {displayRank}
        <div style={{ fontSize: small ? 7 : 10 }}>{displaySymbol}</div>
      </div>
    </div>
  );
}

// Fan/overlapping hand for the player's own cards
export function Hand({ cards, selectedIds, onCardClick, isCurrentPlayer }) {
  const sorted = [...(cards || [])].sort((a, b) => {
    if (a.hidden || b.hidden) return 0;
    const order = { RJ: 16, BJ: 15, A: 14, K: 13, Q: 12, J: 11, '10': 10 };
    const va = order[a.rank] || parseInt(a.rank, 10) || 0;
    const vb = order[b.rank] || parseInt(b.rank, 10) || 0;
    if (vb !== va) return vb - va;
    const suitOrder = { spades: 3, hearts: 2, diamonds: 1, clubs: 0, joker: 4, S: 3, H: 2, D: 1, C: 0 };
    return (suitOrder[b.suit] || 0) - (suitOrder[a.suit] || 0);
  });

  const n = sorted.length;
  // Overlap: each card shifts right by STEP px, selected cards lift further
  const CARD_W = 64;
  const STEP = 22; // overlap amount — lower = more overlap
  const totalWidth = n > 0 ? CARD_W + (n - 1) * STEP : 0;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      padding: '16px 16px 8px',
      minHeight: 110,
      overflowX: 'auto',
    }}>
      <div style={{
        position: 'relative',
        width: totalWidth,
        height: 110,
        flexShrink: 0,
      }}>
        {sorted.map((card, i) => {
          const isSelected = selectedIds?.has?.(card.id);
          return (
            <div
              key={card.id || i}
              style={{
                position: 'absolute',
                left: i * STEP,
                bottom: 0,
                zIndex: isSelected ? n + i + 10 : i,
                transition: 'transform 0.12s ease, z-index 0s',
              }}
            >
              <CardDisplay
                card={card}
                selected={isSelected}
                onClick={isCurrentPlayer && onCardClick ? () => onCardClick(card) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}