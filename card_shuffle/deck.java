package card_shuffle;

import java.util.Random;

public class Deck {
    public static String[] suitsInOrder = {"clubs", "diamonds", "hearts", "spades"};
    public static Random gen = new Random();

    public int numOfCards;
    public Card head;

    public Deck(int numOfCardsPerSuit, int numOfSuits) {
        if (numOfCardsPerSuit < 1 || numOfCardsPerSuit > 13 || numOfSuits < 1 || numOfSuits > suitsInOrder.length) {
            throw new IllegalArgumentException("Invalid number of cards per suit or number of suits.");
        }

        this.numOfCards = 0;
        this.head = null;

        for (int suitIndex = 0; suitIndex < numOfSuits; suitIndex++) {
            for (int rank = 1; rank <= numOfCardsPerSuit; rank++) {
                PlayingCard card = new PlayingCard(suitsInOrder[suitIndex], rank);
                addCard(card);
            }
        }

        addCard(new Joker("red"));
        addCard(new Joker("black"));
    }

    public Deck(Deck d) {
        if (d.head == null) {
            this.head = null;
            this.numOfCards = 0;
            return;
        }

        this.numOfCards = d.numOfCards;
        Card original = d.head;
        Card copyHead = original.getCopy();
        this.head = copyHead;

        Card prevCopy = copyHead;
        original = original.next;

        while (original != d.head) {
            Card newCopy = original.getCopy();
            prevCopy.next = newCopy;
            newCopy.prev = prevCopy;
            prevCopy = newCopy;
            original = original.next;
        }

        prevCopy.next = this.head;
        this.head.prev = prevCopy;
    }

    public Deck() {}

    public void addCard(Card c) {
        if (c == null) {
            throw new IllegalArgumentException("Card cannot be null.");
        }

        if (head == null) {
            head = c;
            head.next = head;
            head.prev = head;
        } else {
            Card tail = head.prev;
            tail.next = c;
            c.prev = tail;
            c.next = head;
            head.prev = c;
        }
        numOfCards++;
    }

    public void shuffle() {
        if (numOfCards <= 1) return;

        Card[] cards = new Card[numOfCards];
        Card current = head;

        for (int i = 0; i < numOfCards; i++) {
            cards[i] = current;
            current = current.next;
        }

        for (int i = numOfCards - 1; i > 0; i--) {
            int j = gen.nextInt(i + 1);
            Card temp = cards[i];
            cards[i] = cards[j];
            cards[j] = temp;
        }

        head = cards[0];
        Card prev = head;

        for (int i = 1; i < numOfCards; i++) {
            prev.next = cards[i];
            cards[i].prev = prev;
            prev = cards[i];
        }

        prev.next = head;
        head.prev = prev;
    }

    public Joker locateJoker(String color) {
        color = color.toLowerCase();
        Card current = head;
        for (int i = 0; i < numOfCards; i++) {
            if (current instanceof Joker && ((Joker) current).getColor().equals(color)) {
                return (Joker) current;
            }
            current = current.next;
        }
        return null;
    }

    public void moveCard(Card c, int p) {
        if (c == null || p < 0) {
            throw new IllegalArgumentException("Invalid card or position.");
        }

        c.prev.next = c.next;
        c.next.prev = c.prev;

        Card target = c;
        for (int i = 0; i < p; i++) {
            target = target.next;
        }

        c.next = target.next;
        target.next.prev = c;
        target.next = c;
        c.prev = target;
    }

    public void tripleCut(Card firstCard, Card secondCard) {
        if (firstCard == null || secondCard == null) {
			throw new IllegalArgumentException("Invalid cards for triple cut.");
		}
		Card cursor = head;
		while (cursor != firstCard && cursor != secondCard) {
			cursor = cursor.next;
		}
		if (cursor == secondCard) {
			Card temp = firstCard;
			firstCard = secondCard;
			secondCard = temp;
		}

		Card beforeFirst = firstCard.prev;
		Card afterSecond = secondCard.next;

		Card Afirst = head;
		Card Alast  = beforeFirst;
		Card Bfirst = firstCard;
		Card Blast  = secondCard;
		Card Cfirst = afterSecond;
		Card Clast  = head.prev;

		boolean aExists = (firstCard != head);
		boolean cExists = (secondCard != Clast);

		if (cExists) {
			Clast.next = Bfirst;
			Bfirst.prev = Clast;
		}

		if (aExists) {
			Blast.next = Afirst;
			Afirst.prev = Blast;
		}

		if (aExists && cExists) {
			Alast.next = Cfirst;
			Cfirst.prev = Alast;
		}

		if (cExists) {
			head = Cfirst;
		} else {
			head = Bfirst;
		}
    }

    public void countCut() {
        int cardNum = head.prev.getValue();
        int cutCount = cardNum % numOfCards;

        if (cutCount == 0 || numOfCards == 1) {
            return;
        }

        Card newHead = head;
        for (int i = 0; i < cutCount; i++) {
            newHead = newHead.next;
        }

        Card newTail = newHead.prev;
        Card oldTail = head.prev;
        head.prev = newTail;
        newTail.next = head;
        oldTail.next = newHead;
        newHead.prev = oldTail;

        head = newHead;
    }

    public Card lookUpCard() {
        if (head == null) {
            return null;
        }

        int value = head.getValue();
        Card current = head;

        for (int i = 0; i < value; i++) {
            current = current.next;
        }

        if (current instanceof Joker) {
            return null;
        } else {
            return current;
        }
    }

    public int generateNextKeystreamValue() {
		while (true) {
			Joker redJoker = locateJoker("red");
			moveCard(redJoker, 1);

			Joker blackJoker = locateJoker("black");
			moveCard(blackJoker, 2);

			tripleCut(redJoker, blackJoker);

			countCut();
			Card keystreamCard = lookUpCard();
			if (keystreamCard == null) {
				continue;
			}
			if (keystreamCard instanceof Joker) {
				continue;
			}
			return keystreamCard.getValue();
		}
	}

    public abstract class Card {
        public Card next;
        public Card prev;

        public abstract Card getCopy();
        public abstract int getValue();
    }

    public class PlayingCard extends Card {
        public String suit;
        public int rank;

        public PlayingCard(String s, int r) {
            this.suit = s.toLowerCase();
            this.rank = r;
        }

        public String toString() {
            String info = "";
            if (this.rank == 1) {
                info += "A";
            } else if (this.rank > 10) {
                String[] cards = {"Jack", "Queen", "King"};
                info += cards[this.rank - 11].charAt(0);
            } else {
                info += this.rank;
            }
            info = (info + this.suit.charAt(0)).toUpperCase();
            return info;
        }

        public PlayingCard getCopy() {
            return new PlayingCard(this.suit, this.rank);
        }

        public int getValue() {
            int i;
            for (i = 0; i < suitsInOrder.length; i++) {
                if (this.suit.equals(suitsInOrder[i]))
                    break;
            }

            return this.rank + 13 * i;
        }
    }

    public class Joker extends Card {
        public String redOrBlack;

        public Joker(String c) {
            if (!c.equalsIgnoreCase("red") && !c.equalsIgnoreCase("black"))
                throw new IllegalArgumentException("Jokers can only be red or black");

            this.redOrBlack = c.toLowerCase();
        }

        public String toString() {
            return (this.redOrBlack.charAt(0) + "J").toUpperCase();
        }

        public Joker getCopy() {
            return new Joker(this.redOrBlack);
        }

        public int getValue() {
            return numOfCards - 1;
        }

        public String getColor() {
            return this.redOrBlack;
        }
    }
}