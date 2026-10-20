// ============================================================
// math/vector.js — Opérations vectorielles 3D (CPU)
// Fonctions pures, aucune dépendance.
// ============================================================

/** Soustraction : a - b */
export function vSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Addition : a + b */
export function vAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Multiplication scalaire : a * s */
export function vScale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Longueur (norme) */
export function vLen(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Normalisation (retourne [0,0,0] si longueur nulle) */
export function vNorm(a) {
  const l = vLen(a) || 1e-9;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Produit vectoriel : a × b */
export function vCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Produit scalaire : a · b */
export function vDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
