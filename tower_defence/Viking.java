package tower_defence;

public class Viking extends Warrior {
    public static double BASE_HEALTH;
    public static int BASE_COST;
    public static int WEAPON_TYPE = 2;
    public static int BASE_ATTACK_DAMAGE;
    private int idleCount = 0;

    public Viking(Tile position) {
        super(position, BASE_HEALTH, WEAPON_TYPE, BASE_ATTACK_DAMAGE, BASE_COST);
    }

    public int takeAction() {
        if (idleCount > 0) {
            idleCount--;
            return 0;
        }

        Tile currentTile = this.getPosition();
        Monster target = null;
        double dmgDealt = 0;

        if (currentTile.getNumOfMonsters() > 0) {
            target = currentTile.getMonster();
            dmgDealt = target.takeDamage(this.getAttackDamage(), this.getWeaponType());
        }
        else {
            Tile nextTile = currentTile.towardTheCamp();
            if (nextTile != null && !nextTile.isCamp() && nextTile.getNumOfMonsters() > 0) {
                target = nextTile.getMonster();
                dmgDealt = target.takeDamage(this.getAttackDamage(), this.getWeaponType());
                idleCount = 1; 
            }
        }

        if (target != null) {
            int skillPoints = (int) Math.floor((this.getAttackDamage() / dmgDealt) + 1);
            return skillPoints;
        }
        return 0;
    }
}

