## Deal Cards
from player import *
from cards import *

my_room = Room()
my_deck = Deck(2)

Deck.deal(my_deck.deck, my_room.room)
