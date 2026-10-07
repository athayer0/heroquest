// Shared boss behavior: HP and phases, the intro (he doesn't act while the name banner shows),
// a hit cooldown that paces the fight, no knockback, slowed but never frozen, and the death
// sequence. Subclasses implement act(dt, ctx) for their attacks, checkPhase() for phase changes,
// and drawing. The play scene handles the door lock, the big HP bar and rewards (see bosses/index.js).
import { ENEMY_HIT } from '../config.js';
import { Enemy } from './enemy.js';
import { Puff } from './effects.js';
import { statusSpeedMult } from '../systems/status.js';
import { randRange } from '../util.js';

export class Boss extends Enemy {
  // cfg: { name, hp, introTime, hitCooldown, deathTime, ... }. size: sprite size in px.
  constructor(id, x, y, hitbox, cfg, size) {
    super(id, x, y, hitbox, cfg);
    this.id = id;
    this.isBoss = true;
    this.name = cfg.name;
    this.maxHp = cfg.hp;
    this.size = size;
    this.spawnT = 0; // the intro state handles the entrance
    this.phase = 1;
    this.state = 'intro';
    this.timer = cfg.introTime;
    this.hitCooldownT = 0;
    this.animT = 0;
    this.puffT = 0;
    this.noKnockback = true;
    this.freezeImmune = true;
  }

  // States in which the boss can't hurt or be hurt.
  get protectedStates() {
    return ['intro', 'dying'];
  }

  get active() {
    return !this.dead && !this.protectedStates.includes(this.state);
  }

  // Fractions of max HP where phases change, marked on the HP bar.
  get phaseMarkers() {
    return [];
  }

  get barColor() {
    return '#b03ad8';
  }

  update(dt, ctx) {
    this.flashT = Math.max(0, this.flashT - dt);
    this.hitCooldownT = Math.max(0, this.hitCooldownT - dt);
    // Slowed bosses act at reduced speed (timers too); the death sequence always runs at full speed.
    const sdt = this.state === 'dying' ? dt : dt * statusSpeedMult(this);
    this.animT += sdt;
    this.timer -= sdt;
    if (this.state === 'intro') {
      if (this.timer <= 0) this.onIntroDone();
    } else if (this.state === 'dying') {
      this.updateDying(dt, ctx);
    } else {
      this.act(sdt, ctx);
    }
  }

  act() {}

  onIntroDone() {
    this.state = 'walk';
  }

  checkPhase() {}

  onDying() {}

  updateDying(dt, ctx) {
    if (!this.dyingStarted) {
      this.dyingStarted = true;
      ctx.clearProjectiles(); // nothing can hurt the hero once the boss is beaten
    }
    this.puffT -= dt;
    if (this.puffT <= 0) {
      this.puffT = 0.12;
      const s = this.size;
      ctx.addEffect(new Puff(this.x + randRange(4, s - 4), this.y + randRange(4, s - 4), 0.4, '#ffb0e0'));
    }
    if (this.timer <= 0) {
      this.dead = true;
      ctx.onBossDefeated(this);
    }
  }

  // The hit cooldown paces sword hits only; spells (swingId null) are already paced by mana.
  hurt(damage, fromX, fromY, swingId = null) {
    const sword = swingId !== null;
    if (!this.active || this.sameSwing(swingId) || (sword && this.hitCooldownT > 0)) return false;
    if (sword) {
      this.lastSwingId = swingId;
      this.hitCooldownT = this.stats.hitCooldown;
    }
    this.flashT = ENEMY_HIT.flashTime;
    this.loseHp(damage);
    return true;
  }

  // Bosses never die on the spot: at 0 HP the death sequence starts, and it ends with
  // ctx.onBossDefeated. So this always returns false.
  loseHp(damage) {
    if (!this.active) return false;
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.state = 'dying';
      this.timer = this.stats.deathTime;
      this.onDying();
    } else {
      this.checkPhase();
    }
    return false;
  }
}
