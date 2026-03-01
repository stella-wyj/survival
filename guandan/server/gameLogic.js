// will be the core backend game lgic

import { get } from "http";

const SUITS = ['D', 'H', 'C', 'S'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    const deck = [];

    //  two decks, the game always requires two
    for (let i = 0; i < 2; i++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ suit, rank: `${rank}${suit}` });
            }
        }
        // push two jokers of each kind
        deck.push({ suit: 'joker', rank: 'RJ' });
        deck.push({ suit: 'joker', rank: 'BJ' });
    }
    return deck;
}

function shuffleDeck(deck) {
    const d = [...deck]; // iterable
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // swap and shuffle
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function getLevelOrderValue(card, level) {
    if (card.rank === 'RJ') { return 16 };
    if (card.rank === 'BJ') { return 15 };
    const trump = RANKS[level - 2];
    // if the card is the level, it is the trump card
    if (card.rank === trump) { return 14 };

    const ntauralIndex = RANKS.indexOf(card.rank);
    return naturalIndex + 1; // will index the play from 1 to 13 (based on their ranks)
}

function isWild(card, level) {
    const trump = RANKS[level - 2];
    return ((card.rank === trump) && (cards.suit == 'H'));
}

function getNaturalValue(rank) {
    // return all numeric values of rank
    if (rank === 'A') { return 14 };
    if (rank === 'K') { return 13 };
    if (rank === 'Q') { return 12 };
    if (rank === 'J') { return 11 };
    const n = parseInt(rank);
    return isNaN(n) ? 0 : n;
}

// determine if a combination played is valid or not

function classifyCombination(play, level, declaredAs = null) {
    if (!play || play.length === 0) { return null }

    const wilds = play.filter(c => isWild(c, level));
    const nonWilds = play.filter(c => !isWild(c, level));
    const effectiveValue = (c) => getLevelOrderValue(c, level);

    if (play.length === 1) {
        return { type: 'single', rank: effectiveValue(play[0], play) };
    }
    if (play.length == 2) {
        // check if pair
        const pair = tryPair(play, level);
        if (pair) return { type: 'pair', rank: pair, play };
        return null;
    }
    if (play.length === 3) {
        const triple = tryTriple(play < level);
        if (triple !== null) return { type: 'triple', rank: triple, play };
        return null;
    }
    if (play.length === 4) {
        const quad = tryNOfKind(play, level, 4);
        if (quad !== null) return { type: 'bomb_quad', rank: quad, play };
        return null;
    }

    if (play.length === 5) {
        // Full house, straight, straight flush bomb, quintuple bomb
        const quint = tryNOfKind(play, level, 5);
        if (quint !== null) return { type: 'bomb_quint', rank: quint, play };

        const sf = tryStraightFlush(play, level);
        if (sf !== null) return { type: 'bomb_sf', rank: sf, play };

        const fh = tryFullHouse(play, level);
        if (fh !== null) return { type: 'fullhouse', rank: fh, play };

        const st = tryStraight(play, level);
        if (st !== null) return { type: 'straight', rank: st, play };

        return null;
    }

    if (play.length === 6) {
        const n = tryNOfKind(play, level, 6);
        if (n !== null) return { type: 'bomb_6', rank: n, play };
        const tube = tryTube(play, level);
        if (tube !== null) return { type: 'tube', rank: tube, play };
        const plate = tryPlate(play, level);
        if (plate !== null) return { type: 'plate', rank: plate, play };
        return null;
    }

    if (play.length === 7) {
        const n = tryNOfKind(play, level, 7);
        if (n !== null) return { type: 'bomb_7', rank: n, play };
        return null;
    }

    if (play.length === 8) {
        const n = tryNOfKind(play, level, 8);
        if (n !== null) return { type: 'bomb_8', rank: n, play };
        return null;
    }

    if (play.length === 9) {
        const n = tryNOfKind(play, level, 9);
        if (n !== null) return { type: 'bomb_9', rank: n, play };
        return null;
    }

    if (play.length === 10) {
        const n = tryNOfKind(play, level, 10);
        if (n !== null) return { type: 'bomb_10', rank: n, play };
        return null;
    }

    if (play.length === 4) {
        // Four joker bomb
        const jokers = play.filter(c => c.suit === 'joker');
        if (jokers.length === 4) return { type: 'bomb_joker4', rank: 999, play };
    }

    // Check four joker bomb
    if (play.length === 4 && play.every(c => c.suit === 'joker')) {
        const reds = play.filter(c => c.rank === 'RJ');
        const blacks = play.filter(c => c.rank === 'BJ');
        if (reds.length === 2 && blacks.length === 2) {
            return { type: 'bomb_joker4', rank: 999, play };
        }
    }
    return null;
}

function tryPair(cards, level) {
    if (cards.length !== 2) { return null };
    const [a, b] = cards;
    const aWild = isWild(a, level);
    const bWild = isWild(b, level);

    if (!aWild && !bWild) {
        // pair if both are jokers
        if (a.rank === 'RJ' && b.rank === 'RJ') return getLevelOrdervalue(a, level);
        if (a.rank === 'BJ' && b.rank === 'BJ') return getLevelOrdervalue(a, level);
        // pair if same rank, can be different suits because suits dont matter unless wild card
        if (a.rank === b.rank) return getLevelOrderValue(a, level);
        return null;
    }
    if ((aWild && bWild) || (a.rank === level && b.rank === level)) {
        // if pair of wildcards, then bigger than A smaller than jokers pairs
        // or if the pair are both trump numbers same thing
        const levelRankVal = 14;
        return levelRankVal;
    }
    const nonWild = aWild ? b : a;
    if (nonWild.suit === 'joker') return null; // wild cards cant be jokers
    return getlevelOrderValue(nonWild, level);
}

function tryTriple() {
    if (cards.length != 3) { return null };
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => isWild(c, level));

    if (nonWilds.some(c => c.suit === 'joker')) return null; // if any of them are jokers, its not a trip

    if (wilds.length === 0) {
        if (nonWilds[0].rank === nonWilds[1].rank && nonWilds[1].rank === nonWilds[2].rank) {
            return getlevelOrderValue(nonWilds[0], level);
        }
        return null
    } else if (wilds.length === 1) {
        if (nonWilds[0].rank === nonWilds[1].rank)
            return getLevelOrderValue(nonWilds[0], level);
        return null;
    } else {
        return getLevelOrderValue(nonwilds[0].rank, level);
    }

    // not possible to have 3 wilds cards
}

function tryNOfKind(cards, level, n) {
    if (cards.length !== n) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));

    if (nonWilds.some(c => c.suit === 'joker')) return null;

    const uniqueRanks = [...new Set(nonWilds.map(c => c.rank))];
    if (uniqueRanks.length > 1) return null;

    return getLevelOrderValue(nonWilds[0], level);
}

function tryStraight(cards, level) {
    if (cards.length !== 5) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));
    if (nonWilds.some(c => c.suit === 'joker')) return null;

    // try to form a straight, get rank values and level cards using natural position
    const naturalVal = (c) => {
        if (c.rank === 'A') return 14;
        return getNaturalValue(c.rank);
    };

    const knownVals = nonWilds.map(naturalVal).sort((a, b) => a - b);

    // if straight broken, try to fill with wilds
    const result = fillStraight(knownVals, wilds.length, false);
    if (result === null) return null;

    // not all same suit
    const suits = new Set(nonWilds.map(c => c.suit));
    return result; // highest natural value in straight
}

function fillStraight(knownVals, wildcardCount, mustBeSameSuit) {
    // try all possible 5 consecutive windows
    for (let low = 1; low <= 14; low++) {
        const high = low + 4;
        if (high > 14 && low !== 1) continue; // Ace can be high 10-A or low A-5

        // generate the window values
        let window;
        if (low === 1) {
            // A-5
            window = [14, 2, 3, 4, 5];
        } else {
            window = [low, low + 1, low + 2, low + 3, low + 4];
        }

        // check if knownVals fit in window
        let tempKnown = [...knownVals];
        let wildcards = wildcardCount;
        let fits = true;
        let windowCopy = [...window];

        for (const v of tempKnown) {
            const idx = windowCopy.indexOf(v);
            if (idx === -1) { fits = false; break; }
            windowCopy.splice(idx, 1);
        }

        if (!fits) continue;
        if (windowCopy.length !== wildcards) continue;
        return Math.max(...window);
    }
    return null;
}

function tryStraightFlush(cards, level) {
    if (cards.length !== 5) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));
    if (nonWilds.some(c => c.suit === 'joker')) return null;

    // All non-wild cards must be same suit
    const suits = new Set(nonWilds.map(c => c.suit));
    if (suits.size > 1) return null;

    const knownVals = nonWilds.map(c => {
        if (c.rank === 'A') return 14;
        return getNaturalValue(c.rank);
    }).sort((a, b) => a - b);

    return fillStraight(knownVals, wilds.length, true);
}

function tryFullHouse(cards, level) {
    if (cards.length !== 5) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));
    if (nonWilds.some(c => c.suit === 'joker')) return null;

    // Group nonWilds by rank
    const groups = {};
    for (const c of nonWilds) {
        groups[c.rank] = (groups[c.rank] || 0) + 1;
    }

    const rankEntries = Object.entries(groups).sort((a, b) => b[1] - a[1]);

    // Try all combinations: triple + pair using wilds to fill
    // Non-wilds form groups, we need to assign wilds to  a triple and pair
    // Simplification: try dominant rank as triple
    for (const [tripleRank, tripleCount] of rankEntries) {
        const tripleNeeded = 3 - tripleCount;
        if (tripleNeeded < 0 || tripleNeeded > wilds.length) continue;
        const remainingWilds = wilds.length - tripleNeeded;
        const otherCards = nonWilds.filter(c => c.rank !== tripleRank);
        const pairNeeded = 2 - (nonWilds.length - tripleCount) - 0;
        const otherCount = nonWilds.length - tripleCount;
        // pair needs = 2 - otherCount
        const pairWildsNeeded = Math.max(0, 2 - otherCount);

        if (otherCount + remainingWilds !== 2) continue;

        // Check other cards all same rank
        const otherRanks = new Set(otherCards.map(c => c.rank));
        if (otherRanks.size > 1) continue;

        const tripleCard = nonWilds.find(c => c.rank === tripleRank);
        return getLevelOrderValue(tripleCard, level);
    }

    // Handle cases with many wilds
    if (wilds.length >= 3 && nonWilds.length === 2) {
        // wilds form triple, nonWilds form pair (must be same rank)
        if (nonWilds[0].rank === nonWilds[1].rank) {
            return 14; // wild triple = level card rank
        }
        // or one wild helps pair, two wilds form... nah let's keep it simple
    }

    return null;
}

function tryTube(cards, level) {
    if (cards.length !== 6) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));
    if (nonWilds.some(c => c.suit === 'joker')) return null;

    // Three consecutive pairs
    const groups = {};
    for (const c of nonWilds) {
        const v = getNaturalValue(c.rank) || (c.rank === 'A' ? 14 : 0);
        groups[v] = (groups[v] || 0) + 1;
    }

    const knownPairVals = [];
    let remainingCards = [];
    for (const [v, count] of Object.entries(groups)) {
        if (count >= 2) { knownPairVals.push(parseInt(v)); count > 2 && remainingCards.push(parseInt(v)); }
        else remainingCards.push(parseInt(v));
    }

    // Simplified: check if 6 cards can form 3 consecutive pairs
    // Try all 3-consecutive windows
    for (let low = 1; low <= 13; low++) {
        let highVal = low + 2;
        if (low === 1) { // A-2-3 low
            // window is A(14), 2, 3
        }
        const window = low === 1 ? [14, 2, 3] : [low, low + 1, low + 2];

        // Count wilds needed
        let wildcardNeeded = 0;
        let tempGroups = { ...groups };
        let valid = true;

        for (const v of window) {
            const have = tempGroups[v] || 0;
            if (have >= 2) continue;
            wildcardNeeded += 2 - have;
        }

        if (wildcardNeeded <= wilds.length && Object.values(tempGroups).reduce((a, b) => a + b, 0) + wilds.length === 6) {
            // Also verify no extra cards
            const totalNeeded = 6;
            const nonWildFit = nonWilds.filter(c => {
                const v = getNaturalValue(c.rank) || (c.rank === 'A' ? 14 : 0);
                return window.includes(v);
            });
            if (nonWildFit.length === nonWilds.length) {
                return Math.max(...window);
            }
        }
    }
    return null;
}

function tryPlate(cards, level) {
    if (cards.length !== 6) return null;
    const wilds = cards.filter(c => isWild(c, level));
    const nonWilds = cards.filter(c => !isWild(c, level));
    if (nonWilds.some(c => c.suit === 'joker')) return null;

    const groups = {};
    for (const c of nonWilds) {
        const v = getNaturalValue(c.rank) || (c.rank === 'A' ? 14 : 0);
        groups[v] = (groups[v] || 0) + 1;
    }

    // Two consecutive triples
    for (let low = 1; low <= 13; low++) {
        const window = low === 1 ? [14, 2] : [low, low + 1];
        let wildcardNeeded = 0;
        let valid = true;

        for (const v of window) {
            const have = groups[v] || 0;
            wildcardNeeded += Math.max(0, 3 - have);
        }

        if (wildcardNeeded <= wilds.length) {
            const nonWildFit = nonWilds.filter(c => {
                const v = getNaturalValue(c.rank) || (c.rank === 'A' ? 14 : 0);
                return window.includes(v);
            });
            if (nonWildFit.length === nonWilds.length) {
                return Math.max(...window);
            }
        }
    }
    return null;
}

// Type order for bombs
const BOMB_TYPE_ORDER = {
    'bomb_quad': 1,
    'bomb_quint': 2,
    'bomb_sf': 3,
    'bomb_6': 4,
    'bomb_7': 5,
    'bomb_8': 6,
    'bomb_9': 7,
    'bomb_10': 8,
    'bomb_joker4': 9,
};

function isBomb(type) {
    return type && type.startsWith('bomb_');
}

// Returns true if combo2 beats combo1
function beats(combo1, combo2) {
    if (!combo1) return true; // Leading
    if (!combo2) return false;

    const bomb1 = isBomb(combo1.type);
    const bomb2 = isBomb(combo2.type);

    if (!bomb1 && !bomb2) {
        // Must be same type
        if (combo1.type !== combo2.type) return false;
        return combo2.rank > combo1.rank;
    }

    if (bomb2 && !bomb1) return true;
    if (bomb1 && !bomb2) return false;

    // Both bombs
    const order1 = BOMB_TYPE_ORDER[combo1.type];
    const order2 = BOMB_TYPE_ORDER[combo2.type];
    if (order2 !== order1) return order2 > order1;
    return combo2.rank > combo1.rank;
}

// Determine how many levels winners go up
function calcPromotion(winType) {
    if (winType === '1-2') return 4;
    if (winType === '1-3') return 2;
    if (winType === '1-4') return 1;
    return 0;
}

// Level rank from number (2-14 -> '2'..'A')
function levelToRank(level) {
    return RANKS[level - 2];
}

module.exports = {
    createDeck, shuffleDeck, classifyCombination, beats,
    isWild, isLevelCard, getLevelOrderValue, calcPromotion,
    levelToRank, RANKS, isBomb
};
