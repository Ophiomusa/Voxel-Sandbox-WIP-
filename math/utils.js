// math/utils.js — Utilitaires mathématiques divers (stub)

/** Interpolation linéaire */
export function lerp(a, b, t) { return a + (b - a) * t; }

/** Clamp d'une valeur entre min et max */
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Degré → radian */
export function deg2rad(d) { return d * Math.PI / 180; }
