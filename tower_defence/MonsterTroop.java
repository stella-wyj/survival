package tower_defence;

public class MonsterTroop {
    private Monster[] monsters;
    private int numOfMonsters;

    public MonsterTroop() {
        this.monsters = new Monster[1]; //start with capacity 1?
        this.numOfMonsters = 0;
    }

    public int sizeOfTroop() {
        return numOfMonsters;
    }

    public Monster[] getMonsters() {
        Monster[] currentTroop = new Monster[numOfMonsters];
        for (int i = 0; i < numOfMonsters; i++) {
            currentTroop[i] = monsters[i];
        }
        return currentTroop;
    }

    public Monster getFirstMonster() {
        if (numOfMonsters == 0) {
            return null;
        }
        return monsters[0];
    }

    public void addMonster(Monster monster) {
        if (numOfMonsters == monsters.length) {
            resize();
        }
        monsters[numOfMonsters++] = monster;
    }

    public boolean removeMonster(Monster monster) {
        for (int i = 0; i < numOfMonsters; i++) {
            if (monsters[i] == monster) {
                for (int j = i; j < numOfMonsters - 1; j++) {
                    monsters[j] = monsters[j + 1];
                }
                numOfMonsters--;
                return true;
            }
        }
        return false;
    }

    private void resize() {
        int newCapacity = (numOfMonsters == 0) ? 1 : numOfMonsters * 2;
        Monster[] newTroop = new Monster[newCapacity];
        for (int i = 0; i < numOfMonsters; i++) {
            newTroop[i] = monsters[i];
        }
        monsters = newTroop;
    }
}
