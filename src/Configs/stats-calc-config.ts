const STAT_CONFIG = {

    STATS_CAP: 100,
    MIN_CRITICAL_STRESS: 60,
    MIN_CRITICAL_BOND: 20,

    BOND_INCREASE_ON_INTERACT: 20,
    // --- Tick timing ---
    TICK_INTERVAL_MS: 2 * 60 * 60 * 1000, // 2 hours per tick
    TICKS_PER_DAY: 12,

    // --- HP drain ---
    BASE_HP_DRAIN_PER_DAY: 10, // baseline decrease, before any multiplier

    // --- Sickness ---
    SICKNESS_RANDOM_ROLL_CHANCE: 0.01,       // per tick, only if not already sick
    SICKNESS_HP_MULTIPLIER: 2,               // while sick, not healing
    HEALING_HP_MULTIPLIER: 1.5,                // while sick AND healing (half of sickness multiplier)
    STRESS_SICKNESS_THRESHOLD: 60,

    // --- Healing ---
    HEAL_MIN_DAYS: 1,
    HEAL_MAX_DAYS: 4,

    // --- Stress (flat-rate triggers) ---
    BOND_LOW_THRESHOLD: 20,                  // bond below this triggers stress
    STRESS_PER_TICK_BOND: 0.3,               // placeholder — never calibrated to a target
    STRESS_PER_TICK_SICK: 0.5,               // placeholder — never calibrated to a target
    STRESS_PER_TICK_UNDERFED: 0.2,           // placeholder — never calibrated to a target

    // --- Underfed ---
    UNDERFED_CALORIE_RATIO_THRESHOLD: 0.40,  // consumed/needed below this = underfed day

    // --- Appetite multipliers ---
    APPETITE_MULTIPLIER_NORMAL: 1,
    APPETITE_MULTIPLIER_STRESSED: 2,
    APPETITE_MULTIPLIER_SICK: 3,

} as const;

export default STAT_CONFIG;