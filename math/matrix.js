// math/matrix.js — Matrices 4x4 (stub — à implémenter)
// Utilisé futur : transformations monde, billboard sprites, etc.

/** Matrice identité 4x4 (Float32Array row-major) */
export function mat4Identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}
