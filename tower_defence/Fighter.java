package tower_defence;

public abstract class Fighter {
    private Tile position;
    private double health;
    private int weaponType;
    private int attackDamage;

    public Fighter(Tile position, double health, int weaponType, int attackDamage) {
        if (position == null || !position.addFighter(this)) {
            throw new IllegalArgumentException("Fighter cannot be placed on the specified tile.");
        }
        this.position = position;
        this.health = health;
        this.weaponType = weaponType;
        this.attackDamage = attackDamage;
    }

    public final Tile getPosition() {
        return position;
    }

    public final double getHealth() {
        return health;
    }

    public final int getWeaponType() {
        return weaponType;
    }

    public final int getAttackDamage() {
        return attackDamage;
    }

    public void setPosition(Tile tile) {
        this.position = tile;
    }

    public double takeDamage(double rawDmg, int attackerWeaponType) {
        double multiplier = 1.0;
        if (attackerWeaponType > this.weaponType) {
            multiplier = 1.5;
        } else if (attackerWeaponType < this.weaponType) {
            multiplier = 0.5;
        }
        double totalDamage = rawDmg * multiplier;
        this.health -= totalDamage;

        if (this.health <= 0 && this.position != null) {
            this.position.removeFighter(this);
        }
        return totalDamage;
    }

    public abstract int takeAction();

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Fighter other = (Fighter) obj;
        return Math.abs(this.health - other.health) <= 0.001 && this.position == other.position;
    }
}
