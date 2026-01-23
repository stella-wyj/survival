## Deal Cards
from player import *
from cards import *

my_room = Room()
my_deck = Deck(2)

Deck.deal(my_deck.deck, my_room.room)
for player in my_room.room:
    print(player.name)
    for card in player.hand:
        print(card.suit, card.rank)
        
