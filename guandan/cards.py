NUM_CARDS=52

import math
import random

class Card:
    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank

    def get_suit(self):
        return self.suit
    
    def get_rank(self):
        return self.rank
    
class Deck:
    def __init__(self, num_decks):
        self.deck = []
        self.num_decks = num_decks
        suits = ["D", "C", "H", "S"]
        for i in range(NUM_CARDS):
            self.deck.extend([Card(suits[math.floor(i//13)], (i%13+1))]*num_decks)    
        self.deck.extend([Card("SJ", 14)]*num_decks) # small joker
        self.deck.extend([Card("BJ", 15)]*num_decks) # big joker
    
    def deal(self):
        random.shuffle()


class Combos:
    def __init__(self):
        pass



# testingggg
my_deck = Deck(2)
for card in my_deck.deck:
    print(card.suit, card.rank)
