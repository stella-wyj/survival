## Deal Cards
from room import *
from cards import *
from game import *

my_room = Room()
my_game = Game()
my_deck = Deck(2, my_game.get_trump())
print(len(my_deck.deck))

Deck.first_deal(my_deck.deck, my_room.room)
for player in my_room.room:
    print("---------- Player", player.name, "----------")
    for card in player.hand:
        print(card.suit, card.rank, card.turned)
        