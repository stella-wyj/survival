from cards import *
from room import *

class Game:
    def __init__(self):
        self.combo_in_play = None  # the combo structure of the first players throw 
        self.trump_num = 1 # starting trump 
        self.first_round = True
        

    # need to create room before
    def start_game(self, players):
        game_deck = Deck()

        if (self.first_round):
            Deck.first_deal(game_deck, players)



    def get_trump(self):
        return self.trump_num

    def compare_plays():
        return

    def is_bigger(current, next_play):
        return False
    
    
