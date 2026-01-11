package tower_defence;

public abstract class Warrior extends Fighter {
    private int requiredSkillPoints;
    public static double CASTLE_DMG_REDUCTION; 
    public Warrior(Tile position, double hp, int weaponType, int attackDamage, int skillPoints) {
        super(position, hp, weaponType, attackDamage);
        this.requiredSkillPoints = skillPoints;
    }

    public int getTrainingCost() {
        return requiredSkillPoints;
    }

    @Override
    public double takeDamage(double dmg, int attackerWeaponType) {
        if (this.getPosition() != null && this.getPosition().isCastle()) {
            dmg *= (1 - CASTLE_DMG_REDUCTION);
        }
        return super.takeDamage(dmg, attackerWeaponType);
    }
}

