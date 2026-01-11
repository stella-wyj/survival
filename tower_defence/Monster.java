package tower_defence;

public class Monster extends Fighter {
    private int rageLevel = 0;
    public static int BERSERK_THRESHOLD;

    public Monster(Tile position, double hp, int weaponType, int attackDamage) {
        super(position, hp, weaponType, attackDamage);
    }

    public int takeAction() {
        if (rageLevel >= BERSERK_THRESHOLD) {
            action();
            action();
            rageLevel = 0;
        } else {
            action();
        }
        return 0;
    }

    private void action() {
        Tile currentTile = this.getPosition();
        if (currentTile.getWarrior() != null) {
            Warrior target = currentTile.getWarrior();
            target.takeDamage(this.getAttackDamage(), this.getWeaponType());
            currentTile.removeFighter(this);
            currentTile.addFighter(this);
        } else {
            Tile nextTile = currentTile.towardTheCastle();
            if (nextTile != null) {
                currentTile.removeFighter(this);
                nextTile.addFighter(this);
            }
        }
    }

    public boolean equals(Object obj) {
        if (!super.equals(obj)) return false;
        Monster other = (Monster) obj;
        return this.getAttackDamage() == other.getAttackDamage();
    }

    public double takeDamage(double dmg, int attackerWeaponType) {
        int weaponDifference = attackerWeaponType - this.getWeaponType();
        double dealtDamage = super.takeDamage(dmg, attackerWeaponType);
        if (weaponDifference > 0 && this.getHealth() > 0) {
            rageLevel += weaponDifference;
        }
        return dealtDamage;
    }
}
