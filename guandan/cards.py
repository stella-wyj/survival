import math
import random
from player import *

NUM_CARDS=52
NUM_PLAYERS=4

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
    
    def deal(deck, players):
        random.shuffle(deck)
        random.shuffle(deck)
        for i in range(len(deck)):
            players[math.floor(i%NUM_PLAYERS)-1].hand.append(deck[i])
            

class Combos:
    def __init__(self):
        pass



# testingggg
my_deck = Deck(2)

