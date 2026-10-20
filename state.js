// ============================================================
// state.js — Source unique de vérité pour tout le moteur
// Tous les modules lisent/écrivent ICI.
// Aucun module ne doit dépendre directement d'un autre pour l'état.
// ============================================================

import { config } from './config.js';

export const state = {
  // --- Grille voxel ---
  gx: config.DEFAULT_GX,
  gy: config.DEFAULT_GY,
  gz: config.DEFAULT_GZ,

  // --- Souris (UV normalisés 0..1 dans la vue active) ---
  mouse: {
    x: 0.5,
    y: 0.5,
    active: 0,           // 1 = bouton gauche enfoncé (dessin)
    tool: 2,             // 0=gomme, 1=mur, 2=sable
    force: 0,            // 0=aucune, 1=vortex, 4=explosion, 5=trou noir
    shape: 0,            // 0=sphère, 1=cube, 2=torus
    justPressed: false,  // vrai uniquement la frame du clic
  },

  // --- Caméra ---
  camRotX: 0.78,  // rotation horizontale (radians)
  camRotY: 0.4,   // rotation verticale (radians)
  // Une cible et un zoom indépendants par vue (0=haut, 1=persp, 2=face, 3=côté/unique)
  camTargets: [
    [64, 32, 64],
    [64, 32, 64],
    [64, 32, 64],
    [64, 32, 64],
  ],
  camZooms: [
    config.DEFAULT_ZOOM,
    config.DEFAULT_ZOOM,
    config.DEFAULT_ZOOM,
    config.DEFAULT_ZOOM,
  ],
  activeViewIndex: 3, // vue actuellement sous la souris

  // --- Multi-vue ---
  multiView: false,
  splitX: 0.5,
  splitY: 0.5,

  // --- Input brut ---
  shiftHeld: false,
  isDraggingCam: false,
  isPanningCam: false,
  lastMouseX: 0,
  lastMouseY: 0,
  dragSplitter: null, // 'v' | 'h' | null
  panViewIndex: 3,
  focusPending: false,

  // --- Runtime ---
  simFrame: 0,
  fps: 60,
  frameCount: 0,
  lastFpsTime: performance.now(),
  shading: 1, // Gardé pour compatibilité

  // --- Colliders ---
  colliders: [],
  activeCollider: -1,

  // --- Laboratoire Physique (Mode Éditeur & Debug) ---
  features: {
    gravity: false,
    viscosity: false,
    diagonalSlip: false,
    horizontalSpread: false,
    collisions: false,
    gumbelChaos: false,
    inertia: false,
    splash: false,
    melt: false,
    experimentalFluid: false
  },
  
  // --- Couleurs de peinture par élément (hex, choisies par l'utilisateur) ---
  // Clé = matId (1=mur, 2=sable, 3=eau, 4=gaz). Valeurs = défauts historiques du moteur.
  elementColors: {
    1: '#80808C', // Mur
    2: '#FFD159', // Sable
    3: '#1A73E6', // Eau
    4: '#D9F2E6', // Gaz
  },

  _recompile: () => {},

  // --- Laboratoire ---
  engine: 1, // 1 = Gumbel-Max, 0 = Classique
  postMode: 0, // 0=Soleil, 1=Couleur, 2=Z-Depth, 3=Normales
  expFluidMode: 0, // 0 = Plat (Horizontal), 1 = Pente (Diagonale), 2 = Les deux
  waterFX: 1,  // 1 = Eau RTX, 0 = Eau Simple
  audioMode: 0, // 0 = Muet, 1 = Musique Générative
  isReadingSound: false,
};
