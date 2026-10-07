// Fire and ice status effects, shared by the hero, enemies and bosses.
//   Burn (fire): damage over time. A new fire hit while burning restarts the timer (no stacking).
//   Chill (ice): slows; a chill on a slowed target freezes it; when the freeze ends the slow is
//   cleared too, so the next chill starts over. Targets with `freezeImmune` (bosses) only slow.
// A target is anything with a `status` object (from newStatus) and optional `immune: ['fire' | 'ice']`.
import { STATUS } from '../config.js';

export function newStatus() {
  return {
    burnT: 0,
    burnTickT: 0,
    burnDps: 0,
    burnByHero: false, // burn damage counts as the hero's spell damage (Destruction XP)
    slowT: 0,
    freezeT: 0,
  };
}

export function clearStatus(target) {
  Object.assign(target.status, newStatus());
}

const isImmune = (target, element) => target.immune?.includes(element) ?? false;

// opts: { damageMult, extraTime, byHero } (Inferno makes the hero's burns stronger).
// Returns true if the target is now burning.
export function applyBurn(target, { damageMult = 1, extraTime = 0, byHero = false } = {}) {
  if (isImmune(target, 'fire')) return false;
  const st = target.status;
  if (st.burnT <= 0) st.burnTickT = STATUS.burn.tickTime;
  st.burnT = STATUS.burn.time + extraTime;
  st.burnDps = STATUS.burn.damagePerSec * damageMult;
  st.burnByHero = byHero;
  return true;
}

// Returns 'slowed' | 'frozen' | null (immune, or already frozen).
export function applyChill(target) {
  if (isImmune(target, 'ice')) return null;
  const st = target.status;
  if (st.freezeT > 0) return null;
  if (st.slowT > 0 && !target.freezeImmune) {
    st.slowT = 0;
    st.freezeT = STATUS.freeze.time;
    target.onFrozen?.();
    return 'frozen';
  }
  st.slowT = STATUS.slow.time;
  return 'slowed';
}

// Applies an element's effect: 'fire' burns, 'ice' chills.
export function applyElement(target, element, burnOpts) {
  if (element === 'fire') applyBurn(target, burnOpts);
  else if (element === 'ice') applyChill(target);
}

// Advances timers. Returns the burn damage dealt this step (0 most steps); the caller applies it,
// since how damage lands differs for the hero, enemies and bosses.
export function updateStatus(target, dt) {
  const st = target.status;
  if (st.freezeT > 0) st.freezeT = Math.max(0, st.freezeT - dt); // the slow was cleared when it began
  else if (st.slowT > 0) st.slowT = Math.max(0, st.slowT - dt);
  if (st.burnT <= 0) return 0;
  st.burnT -= dt;
  st.burnTickT -= dt;
  if (st.burnTickT > 0) return 0;
  st.burnTickT += STATUS.burn.tickTime;
  return Math.max(1, Math.round(st.burnDps * STATUS.burn.tickTime));
}

export const isFrozen = (target) => target.status.freezeT > 0;
export const isSlowed = (target) => target.status.slowT > 0;
export const isBurning = (target) => target.status.burnT > 0;

// Multiplier for movement (and, for enemies, their whole behavior clock).
export function statusSpeedMult(target) {
  if (isFrozen(target)) return 0;
  return isSlowed(target) ? STATUS.slow.speedMult : 1;
}
