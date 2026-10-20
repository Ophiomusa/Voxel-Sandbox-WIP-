// ============================================================
// config.js — Constantes globales immuables du moteur
// Modifier ici pour changer les limites du moteur.
// NE JAMAIS importer d'autres modules ici.
// ============================================================

export const config = {
  // Grille voxel par défaut
  DEFAULT_GX: 128,
  DEFAULT_GY: 64,
  DEFAULT_GZ: 128,

  // Rendu
  COMPACT_WG_X: 8192,   // Workgroups X max pour la passe de compaction
  UNIFORM_BUFFER_SIZE: 512, // 128 slots f32 * 4 bytes (Éditeur Ultime : 2 valises × 5 matières)

  // Caméra
  DEFAULT_ZOOM: 1.8,
  ZOOM_MIN: 0.02,
  ZOOM_MAX: 500,

  // Chunks (8x8x8 voxels par chunk)
  CHUNK_SIZE: 8,

  // Pinceau
  DEFAULT_BRUSH_SIZE: 12,
  DEFAULT_FORCE_RADIUS: 30,
  DEFAULT_STRENGTH: 4,
  DEFAULT_BRUSH_DEPTH: 50,
};
