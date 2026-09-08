const STAT_CONFIG = {

    STATS_CAP: 100,

    // --- Tick timing ---
    TICK_INTERVAL_MS: 2 * 60 * 60 * 1000, // 2 hours per tick
    TICKS_PER_DAY: 12,

    // --- HP drain ---
    BASE_HP_DRAIN_PER_TICK: 10 / 12, // baseline, before any multiplier

    // --- Sickness ---
    SICKNESS_RANDOM_ROLL_CHANCE: 0.10,       // per tick, only if not already sick
    SICKNESS_HP_MULTIPLIER: 4,               // while sick, not healing
    HEALING_HP_MULTIPLIER: 2,                // while sick AND healing (half of sickness multiplier)
    STRESS_SICKNESS_THRESHOLD: 60,           // stress >= this guarantees sickness

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
    // combined (stressed + sick) = STRESSED * SICK = 6, derived, not separately stored
} as const;

export default STAT_CONFIG;