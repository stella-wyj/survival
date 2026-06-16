// botAgent.js — AI-powered bot players using Claude
// Each bot gets a personality and uses the Anthropic API to decide moves + make comments

const { classifyCombination, beats, isBomb, RANKS } = require('./gameLogic');

// Bot personalities — influences their commentary style and play tendencies
const BOT_PERSONALITIES = [
  {
    name: 'Wei Chen',
    emoji: '🧠',
    style: 'analytical',
    description: 'Calm, methodical. Thinks out loud about probabilities. Rarely shows emotion.',
    traits: 'You are methodical and strategic. You speak concisely. You occasionally reference card counts or probabilities. You are not very chatty.',
  },
  {
    name: 'Mei Lin',
    emoji: '🌸',
    style: 'aggressive',
    description: 'Bold and talkative. Loves bombs. Trash-talks (playfully) when winning.',
    traits: 'You are bold and love playing bombs. You are chatty and playful, sometimes teasing opponents. You celebrate when you play a strong hand.',
  },
  {
    name: 'Old Zhang',
    emoji: '🐉',
    style: 'experienced',
    description: 'Wise veteran. Gives advice, references old games, uses Chinese proverbs occasionally.',
    traits: 'You speak like a wise elder who has played thousands of games. You occasionally drop a Chinese proverb or poker wisdom. You are patient and deliberate.',
  },
  {
    name: 'Xiao Fang',
    emoji: '⚡',
    style: 'unpredictable',
    description: 'Young and reckless. Fast plays, lots of exclamations, sometimes makes risky moves.',
    traits: 'You are young, enthusiastic, and a bit reckless. You use exclamations. You sometimes make bold risky plays. You get excited easily.',
  },
];

// Pick a personality by index (for seating)
function getPersonality(seat) {
  return BOT_PERSONALITIES[seat % BOT_PERSONALITIES.length];
}

// Build a text summary of the game state for the AI
function describeGameState(botPlayer, state, level) {
  const levelRank = RANKS[level - 2];
  const myTeam = botPlayer.seat % 2;
  const partner = state.players.find(p => p.seat !== botPlayer.seat && p.seat % 2 === myTeam);
  const opponents = state.players.filter(p => p.seat % 2 !== myTeam);

  const handSummary = summarizeHand(botPlayer.cards, level);

  const lastPlayDesc = state.lastPlay
    ? `Last played: ${state.lastPlay.combo?.type} (rank ${state.lastPlay.combo?.rank}) by ${state.players.find(p => p.id === state.lastPlay.playerId)?.name}`
    : 'No cards played yet — you are leading this trick.';

  const partnerCards = partner ? partner.cardCount ?? partner.cards?.length ?? '?' : '?';
  const oppCards = opponents.map(o => `${o.name}: ${o.cardCount ?? o.cards?.length ?? '?'} cards`).join(', ');
  const finishOrder = state.finishOrder?.map(id => state.players.find(p => p.id === id)?.name).join(' → ') || 'none';

  return `
GAME STATE:
- Current level: ${levelRank} (level ${level})
- Your team: ${myTeam === 0 ? 'Team A (seats 0&2)' : 'Team B (seats 1&3)'}
- Partner: ${partner?.name ?? 'none'} (${partnerCards} cards left)
- Opponents: ${oppCards}
- Players finished this hand: ${finishOrder || 'none'}
- Pass count this trick: ${state.passCount}/3

YOUR HAND (${botPlayer.cards.length} cards):
${handSummary}

TRICK STATUS:
${lastPlayDesc}
`.trim();
}

function summarizeHand(cards, level) {
  const levelRank = RANKS[level - 2];
  const groups = {};
  for (const c of cards) {
    const key = c.rank;
    groups[key] = (groups[key] || []);
    groups[key].push(c);
  }
  const lines = [];
  // Jokers
  const jokers = cards.filter(c => c.suit === 'joker');
  if (jokers.length) lines.push(`Jokers: ${jokers.map(j => j.rank).join(', ')}`);
  // Wild cards
  const wilds = cards.filter(c => c.rank === levelRank && c.suit === 'H');
  if (wilds.length) lines.push(`Wild cards (${levelRank}♥): ${wilds.length}`);
  // Level cards (non-wild)
  const levelNonWild = cards.filter(c => c.rank === levelRank && c.suit !== 'H' && c.suit !== 'joker');
  if (levelNonWild.length) lines.push(`Level cards (${levelRank}): ${levelNonWild.map(c => `${c.rank}${c.suit}`).join(', ')}`);
  // Other cards grouped
  const others = cards.filter(c => c.suit !== 'joker' && c.rank !== levelRank);
  const otherGroups = {};
  for (const c of others) {
    otherGroups[c.rank] = (otherGroups[c.rank] || 0) + 1;
  }
  const sorted = Object.entries(otherGroups).sort((a, b) => {
    const order = { A: 14, K: 13, Q: 12, J: 11, '10': 10 };
    return (order[b[0]] || parseInt(b[0]) || 0) - (order[a[0]] || parseInt(a[0]) || 0);
  });
  for (const [rank, count] of sorted) {
    lines.push(`${rank} ×${count}`);
  }
  return lines.join('\n');
}

// Find all valid plays the bot can make given current trick state
function findValidPlays(cards, lastPlay, level) {
  const valid = [];
  const n = cards.length;

  // Generate candidate combinations to try
  const candidates = [];

  // Singles
  for (let i = 0; i < n; i++) {
    candidates.push([cards[i]]);
  }

  // Pairs, triples, quads etc — group by rank
  const byRank = {};
  for (const c of cards) {
    byRank[c.rank] = byRank[c.rank] || [];
    byRank[c.rank].push(c);
  }
  for (const [rank, group] of Object.entries(byRank)) {
    if (group.length >= 2) candidates.push(group.slice(0, 2));
    if (group.length >= 3) candidates.push(group.slice(0, 3));
    if (group.length >= 4) candidates.push(group.slice(0, 4));
    if (group.length >= 5) candidates.push(group.slice(0, 5));
  }

  // Try some straights (simplified — consecutive natural values)
  if (n >= 5) {
    const sorted = [...cards].sort((a, b) => {
      const v = r => r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : parseInt(r) || 0;
      return v(a.rank) - v(b.rank);
    });
    for (let i = 0; i <= sorted.length - 5; i++) {
      candidates.push(sorted.slice(i, i + 5));
    }
  }

  // Validate each candidate
  for (const cand of candidates) {
    const combo = classifyCombination(cand, level);
    if (!combo) continue;
    if (!lastPlay || beats(lastPlay.combo, combo)) {
      valid.push({ cards: cand, combo });
    }
  }

  return valid;
}

// Call Claude API to decide what to play
async function askClaudeToPlay(botPlayer, state, level, validPlays, canPass) {
  const personality = botPlayer.personality;
  const gameDesc = describeGameState(botPlayer, state, level);

  const playsText = validPlays.length === 0
    ? 'No valid plays available.'
    : validPlays.map((p, i) =>
        `Option ${i}: Play ${p.combo.type} [${p.cards.map(c => `${c.rank}${c.suit}`).join(',')}] (rank ${p.combo.rank})`
      ).join('\n');

  const systemPrompt = `You are an AI player in a Chinese card game called Guandan (掼蛋).
${personality.traits}
Your name is ${personality.name} ${personality.emoji}.

RULES SUMMARY:
- 4 players, 2 teams (seats 0&2 vs 1&3). Partners sit opposite.
- Double deck (108 cards) including 4 jokers.
- Each hand, a level card is determined. Heart level cards are wild.
- Play combinations: singles, pairs, triples, full houses (3+2), straights (5 consecutive), tubes (3 consecutive pairs), plates (2 consecutive triples).
- Bombs beat all non-bombs. Higher bombs beat lower bombs.
- First team with both players empty wins the hand.
- Win 1-2 = +4 levels, 1-3 = +2 levels, 1-4 = +1 level. Reach Ace level and win 1-2 or 1-3 to win the game.

DECISION FORMAT — respond with ONLY valid JSON, no markdown:
{
  "action": "play" or "pass",
  "optionIndex": <number, only if action is "play">,
  "comment": "<optional short in-game chat comment, 1-2 sentences max, in character, or null>"
}

Only include a comment sometimes (30% of the time), not every turn. Keep comments short and in character.
Never include reasoning outside the JSON.`;

  const userPrompt = `${gameDesc}

VALID PLAYS:
${playsText}
${canPass ? 'You may also PASS.' : 'You cannot pass (you are leading the trick).'}

Choose your action. Respond with JSON only.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Strip markdown fences if present
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return parsed;
  } catch (err) {
    console.error(`Bot ${botPlayer.name} API error:`, err.message);
    return null; // Fall back to heuristic
  }
}

// Heuristic fallback: play lowest valid combo, or pass
function heuristicPlay(validPlays, canPass) {
  if (validPlays.length === 0) return { action: 'pass' };

  // Prefer not bombing unless no other option
  const nonBombs = validPlays.filter(p => !isBomb(p.combo.type));
  const pool = nonBombs.length > 0 ? nonBombs : validPlays;

  // Play the lowest-ranked valid combo
  const sorted = [...pool].sort((a, b) => a.combo.rank - b.combo.rank);
  return { action: 'play', optionIndex: validPlays.indexOf(sorted[0]) };
}

// Main entry: decide and execute the bot's turn
async function takeBotTurn(room, botPlayerId, applyPlay, applyPass, broadcastChat) {
  const state = room.gameState;
  const botPlayer = state.players.find(p => p.id === botPlayerId);
  if (!botPlayer || botPlayer.cards.length === 0) return;

  const level = state.atkLevel || 2;
  const canPass = !!state.lastPlay; // can only pass if someone already played
  const validPlays = findValidPlays(botPlayer.cards, state.lastPlay, level);

  const delay = 3000 + Math.random() * 2000;
  await new Promise(r => setTimeout(r, delay));

  let decision = null;

  // Try AI decision
  try {
    decision = await askClaudeToPlay(botPlayer, state, level, validPlays, canPass);
  } catch (e) {
    console.error('Bot AI failed, using heuristic:', e.message);
  }

  // Validate the AI decision, fall back to heuristic if bad
  if (!decision || typeof decision !== 'object') {
    decision = heuristicPlay(validPlays, canPass);
  }
  if (decision.action === 'play' && (decision.optionIndex === undefined || !validPlays[decision.optionIndex])) {
    decision = heuristicPlay(validPlays, canPass);
  }
  if (decision.action === 'pass' && !canPass) {
    // Forced to play — pick lowest
    decision = heuristicPlay(validPlays, false);
    if (decision.action === 'pass') return; // truly no moves (shouldn't happen)
  }

  // Send comment to chat if AI provided one
  if (decision.comment && typeof decision.comment === 'string' && decision.comment.trim()) {
    broadcastChat(room.id, {
      name: `${botPlayer.personality.emoji} ${botPlayer.name}`,
      message: decision.comment.trim(),
      isBot: true,
      time: Date.now(),
    });
  }

  // Execute the action
  if (decision.action === 'pass') {
    applyPass(room, botPlayerId);
  } else {
    const chosen = validPlays[decision.optionIndex];
    if (chosen) {
      applyPlay(room, botPlayerId, chosen.cards, chosen.combo);
    } else {
      applyPass(room, botPlayerId);
    }
  }
}

module.exports = { takeBotTurn, getPersonality, BOT_PERSONALITIES };