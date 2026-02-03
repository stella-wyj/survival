import math
import random
from room import *
from game import *

NUM_CARDS=52
NUM_PLAYERS=4
MAX_THROW = 6 # max number of cards you can play => EXCEPTION BOMBS (8 CARDS PLAYED)

class Card:
    def __init__(self, suit, rank, wild_card=False):
        self.suit = suit
        self.rank = rank
        self.wild_card = wild_card
        self.turned = False

    def get_suit(self):
        return self.suit
    
    def get_rank(self):
        return self.rank
    
    def turn_up(self):
        self.turned = True

class Deck:
    def __init__(self, num_decks, trump):
        self.deck = []
        self.num_decks = num_decks
        suits = ["D", "C", "H", "S"]

        # create new deck each time trump suit change 
        for j in range(num_decks):
            for i in range(NUM_CARDS):
                # if the number created is a trump number, ensure that self.wild_card is true
                if (i%13+1 == trump and suits[math.floor(i//13)]=="H"):
                    self.deck.extend([Card(suits[math.floor(i//13)], (i%13+1), True)])
                else:
                    self.deck.extend([Card(suits[math.floor(i//13)], (i%13+1))])
            
            # add jokers
            self.deck.extend([Card("SJ", 14)]) # small joker
            self.deck.extend([Card("BJ", 15)]) # big joker



    def first_deal(deck, players):
        # first deal has one card turned up
        turned_up = random.randint(0, len(deck))
        print("turning up index", turned_up)
        deck[turned_up].turn_up()

        for card in deck:
            print(card.suit, card.rank, card.turned)


        random.shuffle(deck)
        random.shuffle(deck)

        for i in range(len(deck)):
            if (i == turned_up):
                # if player has turned up card, player is starting
                players[math.floor(i%NUM_PLAYERS)-1].is_starting()

            players[math.floor(i%NUM_PLAYERS)-1].hand.append(deck[i])
            
        for player in players:
            player.hand.sort(key=Card.get_rank)

    
    def deal(deck, players):
        random.shuffle(deck)
        random.shuffle(deck)
        for i in range(len(deck)):
            players[math.floor(i%NUM_PLAYERS)-1].hand.append(deck[i])

        # sort by power 
        for player in players:
            player.hand.sort(key=Card.get_rank)


class Combos:
    COMBO_ORDER = {"single":1, "double":1, "triple": 1, "straight": 1, "tubes": 1, "full_house": 1, "plates":1,
                   "4_bomb":2, "5_bomb": 3, "6_bomb": 4, "7_bomb": 5, "8_bomb": 6} # tubes are double striaghts and plates are triple-triple

    def __init__(self):
        pass






