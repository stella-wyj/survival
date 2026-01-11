package tower_defence;

public class Archer extends Warrior {
    public static double BASE_HEALTH;
    public static int BASE_COST;
    public static int WEAPON_TYPE;
    public static int BASE_ATTACK_DAMAGE;
    private int piercingPower;
    private int actionRange;

    public Archer(Tile position, int piercingPower, int actionRange) {
        super(position, BASE_HEALTH, WEAPON_TYPE, BASE_ATTACK_DAMAGE, BASE_COST);
        this.piercingPower = piercingPower;
        this.actionRange = actionRange;
    }

    public int takeAction() {
        Tile currentTile = this.getPosition();
        Tile attackTile = currentTile;
        int skillPoints = 0;

        for (int i = 0; i < actionRange; i++) {
            attackTile = attackTile.towardTheCamp();
            if (attackTile == null || attackTile.isCamp()) {
                break;
            }
            if (attackTile.getNumOfMonsters() > 0) {
                Monster[] monsters = attackTile.getMonsters();

                if (piercingPower - attackTile.getNumOfMonsters() > 0) {
                    int numOfAttack = attackTile.getNumOfMonsters();
                    for (int j = 0; j <= numOfAttack; j++) {
                        double dmgDealt = monsters[j].takeDamage(this.getAttackDamage(), this.getWeaponType());
                        skillPoints += ((int) (BASE_ATTACK_DAMAGE/dmgDealt) +1);
                    }
                    skillPoints /= numOfAttack;
                }

                //piercing power less than troop size
                if (piercingPower - attackTile.getNumOfMonsters() <= 0) {
                    int numOfAttack = piercingPower;
                    for (int j = 0; j <= numOfAttack; j++) {
                        double dmgDealt = monsters[j].takeDamage(this.getAttackDamage(), this.getWeaponType());
                        skillPoints += (int) ((BASE_ATTACK_DAMAGE/dmgDealt) + 1);
                    }
                    skillPoints /= numOfAttack;
                }
                break;
            }
        }
        return skillPoints;
    }
}


