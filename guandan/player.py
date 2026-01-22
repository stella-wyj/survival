import math
import random
from cards import *  

class Room:
    def __init__(self, num_players):
        self.room = []  
        for i in range(num_players):
            name = input("Enter player name: ")
            self.room.append(Player(name))




class Player:
    def __init__(self, name):
        self.hand = []
        self.turn = False
        self.name = name
    
    

    def play_card(self):
        return
    

