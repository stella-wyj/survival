## Deal Cards
from player import *
from cards import *

player1 = Player("Stella")
my_deck = Deck(1)

player1.take_card(my_deck.deal)


for card in player1.hand:
