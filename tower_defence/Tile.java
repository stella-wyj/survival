package tower_defence;

public class Tile {
    private boolean isCastle = false;
    private boolean isCamp = false;
    private boolean onThePath = false;
    private Tile towardTheCastle;
    private Tile towardTheCamp;
    private Warrior warrior;
    private MonsterTroop troop;

    public Tile() {
        this.isCastle = false;
        this.isCamp = false;
        this.onThePath = false;
        this.warrior = null;
        this.troop = new MonsterTroop();
    }

    public Tile(boolean isCastle, boolean isCamp, boolean onThePath, Tile towardTheCastle,
                Tile towardTheCamp, Warrior warrior, MonsterTroop troop) {
        this.isCastle = isCastle;
        this.isCamp = isCamp;
        this.onThePath = onThePath;
        this.towardTheCastle = towardTheCastle;
        this.towardTheCamp = towardTheCamp;
        this.warrior = warrior;
        this.troop = troop;
    }

    public boolean isCastle() {
        return isCastle;
    }

    public boolean isCamp() {
        return isCamp;
    }

    public void buildCastle() {
        isCastle = true;
    }

    public void buildCamp() {
        isCamp = true;
    }

    public boolean isOnThePath() {
        return onThePath;
    }

    public Tile towardTheCastle() {
        if (!this.onThePath || this.isCastle) {
            return null;
        }
        return towardTheCastle;
    }

    public Tile towardTheCamp() {
        if (!this.onThePath || this.isCamp) {
            return null;
        }
        return towardTheCamp;
    }

    public void createPath(Tile castle, Tile camp) {
        if (this.isCastle && castle != null) {
            this.onThePath = true;
            this.towardTheCamp = camp; 
        } else if (this.isCamp && camp != null) {
            this.onThePath = true;
            this.towardTheCastle = castle;
        } else if (!this.isCastle && !this.isCamp && castle != null && camp != null) {
            this.onThePath = true;
            this.towardTheCastle = castle;
            this.towardTheCamp = camp;
        } else {
            throw new IllegalArgumentException("Invalid path creation parameters!");
        }
    }

    public int getNumOfMonsters() {
        return troop.sizeOfTroop();
    }

    public Monster getMonster() {
        return troop.getFirstMonster();
    }

    public Monster[] getMonsters() {
        return troop.getMonsters();
    }

    public Warrior getWarrior() {
        return warrior;
    }

    public boolean addFighter(Fighter fighter) {
        if (fighter instanceof Monster) {
            if (!this.onThePath) {
                return false;
            }
            troop.addMonster((Monster) fighter);
        } else if (fighter instanceof Warrior) {
            if (this.warrior != null || this.isCamp) {
                return false;
            }
            warrior = (Warrior) fighter;
        }
        fighter.setPosition(this);
        return true;
    }

    public boolean removeFighter(Fighter fighter) {
        if (fighter instanceof Monster) {
            return troop.removeMonster((Monster) fighter);
        } else if (fighter instanceof Warrior) {
            if (warrior == fighter) {
                warrior = null;
                fighter.setPosition(null);
                return true;
            }
        }
        return false;
    }
}

