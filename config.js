export const CONFIG = {
    STARTING_ROUNDS: 6,
    COLORS: {
        NEON_CYAN: '#ffffff',
        NEON_PINK: '#ff00ff',
        NEON_GOLD: '#ffd700'
    },
    NUMBER_SIZE: 60,
    INSERTION_SIZE: 90,
    GLOW_INTENSITY: 0.3,
    LEVEL_MULTIPLIER: 1.5,
    // MAX_VISIBLE_NUMBERS: 11
    LEVEL_CONFIG: [
        { level: 1, slots: 5, rounds: 4 },
        { level: 2, slots: 7, rounds: 6 },
        { level: 3, slots: 9, rounds: 8 },
        { level: 4, slots: 10, rounds: 9 },
        { level: 5, slots: 12, rounds: 11 },
        { level: 6, slots: 14, rounds: 13 },
        { level: 7, slots: 16, rounds: 15 },
        { level: 8, slots: 17, rounds: 16 },
        { level: 9, slots: 18, rounds: 17 }
    ]
};