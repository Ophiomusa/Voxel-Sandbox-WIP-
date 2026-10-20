// ============================================================
// shaders/common/uniforms.wgsl.js
// Structure uniforme partagée par TOUS les shaders.
// ============================================================
export const uniformStruct = /* wgsl */`
struct Uniforms {
    gridX: f32, gridY: f32, gridZ: f32, time: f32,
    mouseX: f32, mouseY: f32, mouseActive: f32, brushSize: f32,
    tool: f32, forceType: f32, forceRadius: f32, camAngle: f32,
    camAngleY: f32, brushDepth: f32, camZoom: f32, resX: f32,
    resY: f32, frame: u32, forceStrength: f32, forceShape: f32,
    rayOriginX: f32, rayOriginY: f32, rayOriginZ: f32, isOrtho: f32,
    rayDirX: f32, rayDirY: f32, rayDirZ: f32, mouseDown: f32,
    camFwdX: f32, camFwdY: f32, camFwdZ: f32, axisLock: f32,
    mouseJustPressed: f32, camTargetX: f32, camTargetY: f32, camTargetZ: f32,
    
    // Position du Soleil
    sunDirX: f32, sunDirY: f32, sunDirZ: f32, labViscosite: f32,      
    useGumbelMax: f32,
    waterOpacity: f32,  // Index 41
    momentumBonus: f32,
    postMode: f32, // index 43


    // --- ÉDITEUR ULTIME DE MATÉRIAUX (Slots 44 à 83) ---
    matParams: array<vec4<f32>, 10>,
    
    // Trigonométrie pré-calculée (Slots 84 à 87)
    camSinX: f32, camCosX: f32, camSinY: f32, camCosY: f32,
    
    // Nouveaux uniforms expérimentaux (Slots 88 à 90)
    fluidSpreadForce: f32,
    fluidSpreadSpeed: f32,
    fluidMode: f32,

    // Couleurs de peinture par élément (Slots 92 à 107 — slot 91 = padding alignement 16B)
    // Index 0 = mur (matId 1), 1 = sable (2), 2 = eau (3), 3 = gaz (4)
    matColors: array<vec4<f32>, 4>
};
`;
