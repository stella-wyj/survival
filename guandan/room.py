import math
import random

NUM_PLAYERS=4

class Room:
    def __init__(self):
        # dict later
        self.room = [] 

        for i in range(NUM_PLAYERS):
            name = input("Enter player name: ")
            self.room.append(Player(name))

class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []
        self.starting = False
        self.turn = False
        self.next_play = None # will be players next combo play
        self.level = 1  # sheng ji (level)


