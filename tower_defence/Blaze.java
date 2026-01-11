package tower_defence;

public class Blaze extends Warrior {
    public static double BASE_HEALTH;
    public static int BASE_COST;
    public static int WEAPON_TYPE = 3;
    public static int BASE_ATTACK_DAMAGE;

    public Blaze(Tile position) {
        super(position, BASE_HEALTH, WEAPON_TYPE, BASE_ATTACK_DAMAGE, BASE_COST);
    }

    public int takeAction() {
        if (this.getPosition().getMonster() != null) {
            Monster target = this.getPosition().getMonster();
            double dmgDealt = target.takeDamage(this.getAttackDamage(), this.getWeaponType());
            int skillPoints = (int) Math.floor((this.getAttackDamage() / dmgDealt) + 1);
            return skillPoints;
        } else { 
            Tile nextTile = this.getPosition().towardTheCamp();
            if (nextTile != null && nextTile.getWarrior() == null && !nextTile.isCamp()){
                this.getPosition().removeFighter(this);
                nextTile.addFighter(this);
            }
            return 0; 
        }
    }
}
