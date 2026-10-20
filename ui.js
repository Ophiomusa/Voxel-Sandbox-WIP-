// ============================================================
// ui.js — Espace de Travail Flottant + Blocs Indépendants
// Architecture : workspace > viewport (clip) > content (transform)
// ============================================================

import { state } from './state.js';
import { config } from './config.js';

export const configUI = [
  {
    title: "Grille Voxel",
    items: [
      { type: "slider", id: "ResX", label: "Taille X (Largeur)", min: 2, max: 512, value: 128 },
      { type: "slider", id: "ResY", label: "Taille Y (Hauteur)", min: 2, max: 512, value: 64 },
      { type: "slider", id: "ResZ", label: "Taille Z (Profondeur)", min: 2, max: 512, value: 128 },
      { type: "slider", id: "RenderRes", label: "Echelle Ecran", min: 0.5, max: 4, step: 0.25, value: 1 },
    ]
  },
  {
    title: "Camera",
    items: [
      { type: "slider", id: "Zoom", label: "Zoom (Molette)", min: 0.02, max: 500, step: 0.01, value: 1.8 },
      { type: "button", id: "btnMultiView", label: "Vue 4 Axes (Espace)" },
      { type: "button-group", id: "postMode", buttons: [
        { val: 0, label: "Jeu (Soleil)", active: true },
        { val: 1, label: "Couleur (Brute)" },
        { val: 2, label: "Voir Z-Depth" },
        { val: 3, label: "Voir Normales" }
      ]}
    ]
  },
  {
    title: "Lumière & Soleil",
    items: [
      { type: "slider", id: "SunAz", label: "Rotation (Azimuth)", min: 0, max: 360, step: 1, value: 135 },
      { type: "slider", id: "SunEl", label: "Hauteur (Élévation)", min: 0, max: 90, step: 1, value: 45 }
    ]
  },
  {
    title: "Outils",
    items: [
      { type: "button-group", id: "tool", buttons: [
        { val: 2, label: "Sable", active: true },
        { val: 3, label: "Eau" },
        { val: 4, label: "Gaz" },
        { val: 1, label: "Mur" },
        { val: 0, label: "Gomme" },
        { val: 99, label: "Aucun" }
      ]},
      { type: "slider", id: "Brush", label: "Taille / Rayon", min: 1, max: 80, value: 12 },
      { type: "slider", id: "Depth", label: "Profondeur d'Action", min: 0, max: 100, value: 50, unit: "%" }
    ]
  },
  {
    title: "Peinture : Couleur",
    items: [
      { type: "color", id: "ColMur", label: "Mur", mat: 1 },
      { type: "color", id: "ColSable", label: "Sable", mat: 2 },
      { type: "color", id: "ColEau", label: "Eau", mat: 3 },
      { type: "color", id: "ColGaz", label: "Gaz", mat: 4 }
    ]
  },
  {
    title: "Forces",
    items: [
      { type: "button-group", id: "force", buttons: [
        { val: 0, label: "Aucune Force", active: true, fullWidth: true },
        { val: 1, label: "Vortex Z" },
        { val: 4, label: "Explosion" },
        { val: 5, label: "Trou Noir" }
      ]},
      { type: "button-group", id: "shape", buttons: [
        { val: 0, label: "Sphere", active: true },
        { val: 1, label: "Cube" },
        { val: 2, label: "Torus" }
      ]},
      { type: "slider", id: "Force", label: "Rayon / Dimension", min: 1, max: 150, value: 30 },
      { type: "slider", id: "Strength", label: "Intensite", min: 0, max: 10, step: 0.5, value: 4 }
    ]
  },
  {
    title: "Laboratoire (Forces Globales)",
    items: [
      { type: "button-group", id: "audio", buttons: [
        { val: 0, label: "Son OFF", active: true },
        { val: 1, label: "Musique Harmonieuse" }
      ]},
      { type: "button-group", id: "engine", buttons: [
        { val: 0, label: "Classique" },
        { val: 1, label: "Gumbel-Max", active: true }
      ]},
      { type: "slider", id: "LabSplashFactor", label: "Onde de choc (Splash)", min: 0, max: 10, step: 0.1, value: 1.5 },
      { type: "slider", id: "LabMomentumBonus", label: "Inertie (Glissade)", min: 0, max: 10, step: 0.1, value: 1.0 },
      { type: "button", id: "btnResetGrid", label: "Vider la grille (Reset)" }
    ]
  },
  {
    title: "Matière : Eau",
    items: [
      { type: "button-group", id: "waterFX", buttons: [
        { val: 0, label: "Eau Simple" },
        { val: 1, label: "Eau RTX (Translucide)", active: true }
      ]},
      { type: "slider", id: "WaterOpacity", label: "Opacité (Épaisseur) %", min: 10, max: 100, step: 1, value: 80 },
      { type: "slider", id: "EauDens", label: "Densité (Lourd coule)", min: 0.1, max: 100, step: 0.1, value: 10.0 },
      { type: "slider", id: "EauGrav", label: "Gravité (-1=Bas, 1=Haut)", min: -1, max: 1, step: 0.01, value: -1 },
      { type: "slider", id: "EauDiag", label: "Glissade Diagonale %", min: 0, max: 100, step: 1, value: 100 },
      { type: "slider", id: "EauHoriz", label: "Étalement (Liquide) %", min: 0, max: 100, step: 1, value: 100 },
      { type: "slider", id: "EauVisc", label: "Viscosité (Ralenti) %", min: 0, max: 100, step: 1, value: 0 },
      { type: "slider", id: "EauMelt", label: "Fonte par Impact %", min: 0, max: 100, step: 1, value: 50 },
      { type: "slider", id: "EauSplash", label: "Force d'éclaboussure", min: 0, max: 500, step: 1, value: 50 },
      { type: "slider", id: "EauMom", label: "Inertie (Glissade)", min: 0, max: 500, step: 1, value: 50 }
    ]
  },
  {
    title: "Matière : Gaz",
    items: [
      { type: "slider", id: "GazDens", label: "Densité (Lourd coule)", min: 0.1, max: 100, step: 0.1, value: 1.0 },
      { type: "slider", id: "GazGrav", label: "Gravité (-1=Bas, 1=Haut)", min: -1, max: 1, step: 0.01, value: 1 },
      { type: "slider", id: "GazDiag", label: "Glissade Diagonale %", min: 0, max: 100, step: 1, value: 100 },
      { type: "slider", id: "GazHoriz", label: "Étalement (Liquide) %", min: 0, max: 100, step: 1, value: 100 },
      { type: "slider", id: "GazVisc", label: "Viscosité %", min: 0, max: 100, step: 1, value: 0 },
      { type: "slider", id: "GazMelt", label: "Fonte par Impact %", min: 0, max: 100, step: 1, value: 50 },
      { type: "slider", id: "GazSplash", label: "Force d'éclaboussure", min: 0, max: 500, step: 1, value: 10 },
      { type: "slider", id: "GazMom", label: "Inertie (Glissade)", min: 0, max: 500, step: 1, value: 10 }
    ]
  },
  {
    title: "Matière : Sable",
    items: [
      { type: "slider", id: "SableDens", label: "Densité (Lourd coule)", min: 0.1, max: 100, step: 0.1, value: 50.0 },
      { type: "slider", id: "SableGrav", label: "Gravité (-1=Bas, 1=Haut)", min: -1, max: 1, step: 0.01, value: -1 },
      { type: "slider", id: "SableDiag", label: "Glissade Diagonale %", min: 0, max: 100, step: 1, value: 80 },
      { type: "slider", id: "SableHoriz", label: "Étalement (Liquide) %", min: 0, max: 100, step: 1, value: 0 },
      { type: "slider", id: "SableVisc", label: "Viscosité %", min: 0, max: 100, step: 1, value: 0 },
      { type: "slider", id: "SableMelt", label: "Fonte par Impact %", min: 0, max: 100, step: 1, value: 80 },
      { type: "slider", id: "SableSplash", label: "Force d'éclaboussure", min: 0, max: 500, step: 1, value: 0 },
      { type: "slider", id: "SableMom", label: "Inertie (Glissade)", min: 0, max: 500, step: 1, value: 0 }
    ]
  },
  {
    title: "Murs de Collision (Objets)",
    items: [
      { type: "button", id: "btnAddSphere", label: "Créer une Sphère ici" },
      { type: "button", id: "btnClearSpheres", label: "Effacer les sphères" },
      { type: "slider", id: "ColRadius", label: "Taille (Rayon)", min: 1, max: 150, value: 20 },
      { type: "slider", id: "ColX", label: "Position X", min: 0, max: 512, value: 64 },
      { type: "slider", id: "ColY", label: "Position Y", min: 0, max: 512, value: 32 },
      { type: "slider", id: "ColZ", label: "Position Z", min: 0, max: 512, value: 64 }
    ]
  },
  {
    title: "Diagnostic",
    customHTML: `
      <div style="font-family:monospace; font-size:11px; color:#777;">
        <div>GPU : <span data-diag="gpuname" style="color:#888;">…</span></div>
        <div>Frame : <span data-diag="frametime" style="color:#888;">0ms</span></div>
        <div style="background:#1a1a1a; height:4px; border-radius:2px; margin-top:2px;">
          <div data-diag="frametime-bar" style="height:100%; width:0%; border-radius:2px; transition:width 0.1s"></div>
        </div>
        <div>FPS : <span data-diag="fps" style="color:#888;">60</span></div>
        <div>Voxels : <span data-diag="voxels" style="color:#888;">…</span></div>
        <div>VRAM : <span data-diag="vram" style="color:#888;">…</span></div>
        <div style="margin-top:4px; border-top:1px solid #222; padding-top:4px;">
          <div>Draw calls : <span data-diag="drawcalls" style="color:#888;">0</span></div>
          <div>Render : <span data-diag="dcrender" style="color:#888;">0</span> · Debug : <span data-diag="dcdebug" style="color:#888;">0</span></div>
          <div>Passes R/C : <span data-diag="passes" style="color:#888;">1 / 4</span></div>
        </div>
        <div style="margin-top:4px; border-top:1px solid #222; padding-top:4px;">
          <div>Canvas : <span data-diag="resolution" style="color:#888;">0×0</span></div>
          <div>Vue : <span data-diag="multiview" style="color:#888;">Single</span></div>
          <div>Colliders : <span data-diag="colliders" style="color:#888;">0</span></div>
        </div>
      </div>
      <button id="btnClearGrid" data-bind="btnClearGrid" style="background:#1a1a1a; border-color:#333; width:100%; margin-top:8px; padding:7px; color:#777; border:1px solid #333; border-radius:2px; cursor:pointer; font-weight:bold; font-size:11px;">Purger la Grille</button>
    `
  },
  {
    title: "Laboratoire Debug",
    items: [
      { type: "button", id: "tglGravity", label: "Gravité (Chute libre)" },
      { type: "button", id: "tglViscosity", label: "Viscosité (Frein)" },
      { type: "button", id: "tglDiagonalSlip", label: "Glissade Diagonale" },
      { type: "button", id: "tglHorizSpread", label: "Étalement Latéral" },
      { type: "button", id: "tglCollisions", label: "Collisions (Sphères)" },
      { type: "button", id: "tglInertia", label: "Inertie (Momentum)" },
      { type: "button", id: "tglSplash", label: "Splash (Éclaboussure)" },
      { type: "button", id: "tglMelt", label: "Fonte (Thixotropie)" },
      { type: "button", id: "tglExperimentalFluid", label: "Test: Fluide Expérimental" },
      { type: "button-group", id: "expFluidMode", buttons: [
        { val: 0, label: "Mode Plat (Horiz)", active: true },
        { val: 1, label: "Mode Pente (Diag)" },
        { val: 2, label: "Mode Pression (Hydro)" }
      ]},
      { type: "slider", id: "ExpSpreadForce", label: "Force Étalement (Test)", min: 0, max: 100, step: 1, value: 50 },
      { type: "slider", id: "ExpSpreadSpeed", label: "Vitesse Étalement (Sauts)", min: 1, max: 5, step: 1, value: 1 },
      { type: "button", id: "tglGumbelChaos", label: "Macro-Turbulence (Gumbel)" },
      { type: "button", id: "btnResetDebug", label: "TOUT DESACTIVER" }
    ]
  },
  {
    title: "Aide",
    customHTML: `
      <div style="font-size:11px; color:#777; line-height:1.6;">
        <b style="color:#888;">Clic gauche</b> : peindre<br>
        <b style="color:#888;">Alt + clic gauche</b> : orbit camera<br>
        <b style="color:#888;">Molette clic</b> : deplacer vue (pan)<br>
        <b style="color:#888;">Molette</b> : zoom<br>
        <b style="color:#888;">F</b> : recentrer sur curseur<br>
        <b style="color:#888;">Espace</b> : basculer multi-vue
      </div>
    `
  }
];

let workspaceZIndex = 100;
let blockZIndex = 10;
let workspaceCount = 0;
let workspaces = [];
let uiContainer = null;

export function buildUI(container) {
  container.innerHTML = '';
  workspaceCount = 0;
  workspaces = [];
  uiContainer = container;
  createWorkspace(container, 20, 20);
}

function createWorkspace(container, x, y, source) {
  workspaceCount++;
  const wsIndex = workspaceCount;

  const ws = document.createElement('div');
  ws.className = 'workspace';
  ws.dataset.ws = wsIndex;

  const titleBar = document.createElement('div');
  titleBar.className = 'workspace-title';
  titleBar.textContent = 'Node Graph' + (workspaces.length > 0 ? ' ' + wsIndex : '');
  ws.appendChild(titleBar);

  const viewport = document.createElement('div');
  viewport.className = 'workspace-viewport';
  ws.appendChild(viewport);

  const content = document.createElement('div');
  content.className = 'workspace-content';
  content.dataset.ws = wsIndex;
  viewport.appendChild(content);

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'workspace-resize';
  ws.appendChild(resizeHandle);

  container.appendChild(ws);

  let zoom = 1, panX = 0, panY = 0;
  let isPanning = false, panStartX = 0, panStartY = 0;

  const ww = Math.min(900, window.innerWidth - 40);
  const wh = Math.min(600, window.innerHeight - 40);
  ws.style.left = x + 'px';
  ws.style.top = y + 'px';
  ws.style.width = ww + 'px';
  ws.style.height = wh + 'px';

  if (source) {
    createBlocks(content);
    copyBlockPositions(source, content);
    copyDiagnostic(source, content);
  } else {
    createBlocks(content);
    repositionBlocks(content, viewport);
  }

  initDrag(ws, titleBar, { bringToFront: () => { ws.style.zIndex = ++workspaceZIndex; } });
  initResize(ws, resizeHandle, () => { repositionBlocks(content, viewport); panX = 0; panY = 0; zoom = 1; updateContentTransform(content, panX, panY, zoom); });

  function updateTransform() { updateContentTransform(content, panX, panY, zoom); }

  function syncZoom(newZoom, mx, my) {
    const oldZoom = zoom;
    zoom = Math.max(0.2, Math.min(4.0, newZoom));
    panX = mx - (mx - panX) * (zoom / oldZoom);
    panY = my - (my - panY) * (zoom / oldZoom);
    updateTransform();
  }

  viewport.addEventListener('wheel', e => {
    e.preventDefault(); e.stopPropagation();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    syncZoom(zoom + delta, mx, my);
  }, { passive: false });

  viewport.addEventListener('mousedown', e => {
    if (e.button === 1) { isPanning = true; panStartX = e.clientX - panX; panStartY = e.clientY - panY; e.preventDefault(); e.stopPropagation(); }
  });

  window.addEventListener('mousemove', e => { if (!isPanning) return; panX = e.clientX - panStartX; panY = e.clientY - panStartY; updateTransform(); });
  window.addEventListener('mouseup', () => { isPanning = false; });
  ws.addEventListener('mousedown', () => { ws.style.zIndex = ++workspaceZIndex; });

  const reorgBtn = document.createElement('div');
  reorgBtn.className = 'workspace-reorg';
  reorgBtn.textContent = '\u21BB';
  reorgBtn.title = 'Réorganiser les blocs';
  reorgBtn.addEventListener('click', e => { e.stopPropagation(); repositionBlocks(content, viewport); panX = 0; panY = 0; zoom = 1; updateTransform(); });
  titleBar.appendChild(reorgBtn);

  const dupBtn = document.createElement('div');
  dupBtn.className = 'workspace-reorg';
  dupBtn.style.right = '32px';
  dupBtn.textContent = '+';
  dupBtn.title = 'Dupliquer ce workspace';
  dupBtn.addEventListener('click', e => { e.stopPropagation(); const rect = ws.getBoundingClientRect(); createWorkspace(container, rect.left + 30, rect.top + 30, content); });
  titleBar.appendChild(dupBtn);

  if (workspaces.length > 0) {
    const closeBtn = document.createElement('div');
    closeBtn.className = 'workspace-reorg';
    closeBtn.style.right = '56px';
    closeBtn.textContent = '\u00D7';
    closeBtn.style.fontSize = '16px';
    closeBtn.title = 'Fermer ce workspace';
    closeBtn.addEventListener('click', e => { e.stopPropagation(); ws.remove(); workspaces = workspaces.filter(w => w.content !== content); });
    titleBar.appendChild(closeBtn);
  }

  const wsObj = { ws, content, viewport };
  workspaces.push(wsObj);
  return wsObj;
}

function createBlocks(content) { for (const block of configUI) { const el = renderBlock(block); content.appendChild(el); } }

function repositionBlocks(content, viewport) {
  const blocks = content.querySelectorAll('.block');
  const vpH = viewport.clientHeight;
  let colX = 10, colY = 10, colMaxW = 0;
  let totalW = 0, totalH = 0;
  for (const el of blocks) {
    const w = el.offsetWidth || 300; const h = el.offsetHeight;
    if (colY + h + 10 > vpH && colY > 10) { colX += colMaxW + 10; colY = 10; colMaxW = 0; }
    el.style.left = colX + 'px'; el.style.top = colY + 'px';
    colMaxW = Math.max(colMaxW, w); colY += h + 10;
    totalW = Math.max(totalW, colX + w); totalH = Math.max(totalH, colY);
  }
  content.style.width = (totalW + 10) + 'px'; content.style.height = (totalH + 10) + 'px';
}

function copyBlockPositions(sourceContent, targetContent) {
  const sourceBlocks = sourceContent.querySelectorAll('.block'); const targetBlocks = targetContent.querySelectorAll('.block');
  for (let i = 0; i < Math.min(sourceBlocks.length, targetBlocks.length); i++) { targetBlocks[i].style.left = sourceBlocks[i].style.left; targetBlocks[i].style.top = sourceBlocks[i].style.top; }
}

function copyDiagnostic(sourceContent, targetContent) {
  sourceContent.querySelectorAll('[data-diag]').forEach(src => { const dst = targetContent.querySelector('[data-diag="' + src.dataset.diag + '"]'); if (dst) dst.innerText = src.innerText; });
}

function updateContentTransform(content, panX, panY, zoom) { content.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; }

function renderBlock(block) {
  const el = document.createElement('div'); el.className = 'block';
  const title = document.createElement('div'); title.className = 'block-title'; title.textContent = block.title; el.appendChild(title);
  const content = document.createElement('div'); content.className = 'block-content';
  if (block.customHTML) { content.innerHTML = block.customHTML; } 
  else if (block.items) { for (const item of block.items) { if (item.type === 'slider') content.appendChild(renderSlider(item)); else if (item.type === 'button') content.appendChild(renderButton(item)); else if (item.type === 'button-group') content.appendChild(renderButtonGroup(item)); else if (item.type === 'color') content.appendChild(renderColor(item)); } }
  el.appendChild(content);
  initDrag(el, title, { bringToFront: () => { el.style.zIndex = ++blockZIndex; } });
  return el;
}

function renderSlider(item) {
  const wrap = document.createElement('div'); wrap.style.marginTop = '8px';
  const label = document.createElement('label'); label.textContent = item.label; wrap.appendChild(label);
  const row = document.createElement('div'); row.className = 'slider-row';
  const range = document.createElement('input'); range.type = 'range'; range.className = 'slider-range'; range.id = 'inp' + item.id; range.dataset.bind = item.id; range.min = item.min; range.max = item.max; range.step = item.step || 1; range.value = item.value;
  const num = document.createElement('input'); num.type = 'number'; num.className = 'slider-num'; num.id = 'num' + item.id; num.dataset.bind = item.id; num.min = item.min; num.max = item.max; num.step = item.step || 1; num.value = item.value;
  row.appendChild(range); row.appendChild(num); wrap.appendChild(row);
  return wrap;
}

function renderButton(item) {
  const btn = document.createElement('button'); btn.className = 'menu-btn'; btn.id = item.id; btn.dataset.bind = item.id; btn.textContent = item.label;
  return btn;
}

function renderButtonGroup(item) {
  const group = document.createElement('div'); group.className = 'btn-group';
  for (const btn of item.buttons) {
    const b = document.createElement('button'); b.dataset.type = item.id; b.dataset.val = btn.val; b.textContent = btn.label;
    if (btn.fullWidth) b.style.flex = '1 1 100%';
    if (btn.active) { b.classList.add(item.id === 'force' ? 'active-force' : 'active-brush'); }
    group.appendChild(b);
  }
  return group;
}

function renderColor(item) {
  const wrap = document.createElement('div'); wrap.className = 'color-row';
  const label = document.createElement('label'); label.textContent = item.label;
  const input = document.createElement('input'); input.type = 'color'; input.className = 'color-swatch';
  input.id = 'inp' + item.id; input.dataset.bind = item.id; input.dataset.mat = item.mat;
  input.value = state.elementColors[item.mat] || '#FFFFFF';
  input.title = 'Couleur de "' + item.label + '"';
  wrap.appendChild(input); wrap.appendChild(label);
  return wrap;
}

function initDrag(el, handle, opts = {}) {
  let dragging = false, startMouseX = 0, startMouseY = 0, startLeft = 0, startTop = 0;
  handle.addEventListener('mousedown', e => { dragging = true; startMouseX = e.clientX; startMouseY = e.clientY; startLeft = parseFloat(el.style.left) || 0; startTop = parseFloat(el.style.top) || 0; if (opts.bringToFront) opts.bringToFront(); e.preventDefault(); e.stopPropagation(); });
  window.addEventListener('mousemove', e => { if (!dragging) return; const dx = e.clientX - startMouseX; const dy = e.clientY - startMouseY; el.style.left = (startLeft + dx) + 'px'; el.style.top = (startTop + dy) + 'px'; });
  window.addEventListener('mouseup', () => { dragging = false; });
}

function initResize(el, handle, onResize) {
  let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;
  handle.addEventListener('mousedown', e => { resizing = true; startX = e.clientX; startY = e.clientY; startW = el.offsetWidth; startH = el.offsetHeight; e.preventDefault(); e.stopPropagation(); });
  window.addEventListener('mousemove', e => { if (!resizing) return; let nw = startW + (e.clientX - startX); let nh = startH + (e.clientY - startY); nw = Math.max(300, Math.min(window.innerWidth - el.offsetLeft, nw)); nh = Math.max(200, Math.min(window.innerHeight - el.offsetTop, nh)); el.style.width = nw + 'px'; el.style.height = nh + 'px'; });
  window.addEventListener('mouseup', () => { if (resizing && onResize) onResize(); resizing = false; });
}

function syncSlider(bindId, value) {
  uiContainer.querySelectorAll(`[data-bind="${bindId}"]`).forEach(el => { if (el.value !== value) el.value = value; });
}

function syncButtonGroup(type, activeVal) {
  uiContainer.querySelectorAll(`.btn-group button[data-type="${type}"]`).forEach(btn => {
    const isActive = btn.dataset.val === String(activeVal);
    const cls = type === 'force' ? 'active-force' : 'active-brush';
    if (isActive) btn.classList.add(cls); else btn.classList.remove(cls);
  });
}

function dispatchBind(id) {
  if (id === 'RenderRes') window.dispatchEvent(new Event('resize'));
  if (id.startsWith('Res')) window.dispatchEvent(new Event('grid-resize'));
}

export function wireBindings() {
  uiContainer.addEventListener('input', e => {
    const t = e.target;
    const bindId = t.dataset.bind;
    if (!bindId) return;

    if (t.type === 'color') {
      const mat = parseInt(t.dataset.mat);
      if (mat && state.elementColors[mat] !== undefined) {
        state.elementColors[mat] = t.value;
        // Synchronise les autres pickers du même élément (workspaces dupliqués)
        uiContainer.querySelectorAll(`input[type="color"][data-mat="${mat}"]`).forEach(el => { if (el !== t && el.value !== t.value) el.value = t.value; });
      }
      return;
    }

    if (t.classList.contains('slider-range') || t.classList.contains('slider-num')) {
      syncSlider(bindId, t.value);
      // NOUVEAU : On ne recalcule PAS la grille pendant qu'on glisse !
      if (!bindId.startsWith('Res') && bindId !== 'RenderRes') {
        dispatchBind(bindId);
      }
    }
  });

  uiContainer.addEventListener('change', e => {
    const t = e.target;
    const bindId = t.dataset.bind;
    if (!bindId) return;

    if (t.classList.contains('slider-range') || t.classList.contains('slider-num')) {
      syncSlider(bindId, t.value);
      // NOUVEAU : On ne recalcule la grille qu'à la fin du mouvement (au relâchement)
      dispatchBind(bindId);
    }
  });

  uiContainer.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    const type = t.dataset.type;
    if (type) {
      const val = parseInt(t.dataset.val);
      if (type === 'tool') state.mouse.tool = val;
      else if (type === 'force') state.mouse.force = val;
      else if (type === 'shape') state.mouse.shape = val;
      else if (type === 'engine') state.engine = val;
      else if (type === 'postMode') state.postMode = val;
      else if (type === 'waterFX') state.waterFX = val;
      else if (type === 'audio') { 
        state.audioMode = val; 
        if(val === 1 && window.startAudio) window.startAudio(); 
      }
      else if (type === 'expFluidMode') {
        state.expFluidMode = val;
        syncButtonGroup('expFluidMode', val);
        return;
      }
      syncButtonGroup(type, val);
      return;
    }
    const bindId = t.dataset.bind;
    if (bindId === 'btnMultiView') {
      state.multiView = !state.multiView;
      uiContainer.querySelectorAll('[data-bind="btnMultiView"]').forEach(btn => { btn.classList.toggle('active-brush', state.multiView); });
      window.dispatchEvent(new Event('multiview-changed'));
      return;
    }
    if (bindId === 'btnClearGrid') {
      if (window.clearGrid) window.clearGrid();
      return;
    }

    // --- Logique du Laboratoire Debug ---
    const toggleMap = {
      'tglGravity': 'gravity',
      'tglViscosity': 'viscosity',
      'tglDiagonalSlip': 'diagonalSlip',
      'tglHorizSpread': 'horizontalSpread',
      'tglCollisions': 'collisions',
      'tglGumbelChaos': 'gumbelChaos',
      'tglInertia': 'inertia',
      'tglSplash': 'splash',
      'tglMelt': 'melt',
      'tglExperimentalFluid': 'experimentalFluid'
    };

    if (toggleMap[bindId]) {
      const featureName = toggleMap[bindId];
      state.features[featureName] = !state.features[featureName];
      t.classList.toggle('active-brush', state.features[featureName]);
      state._recompile();
      return;
    }

    if (bindId === 'btnResetDebug') {
      for (let key in state.features) {
        state.features[key] = false;
      }
      Object.keys(toggleMap).forEach(id => {
        const btn = uiContainer.querySelector(`[data-bind="${id}"]`);
        if (btn) btn.classList.remove('active-brush');
      });
      state._recompile();
      return;
    }
  });
}