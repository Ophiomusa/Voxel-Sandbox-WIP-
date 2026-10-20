// ============================================================
// shaders/compute/raycast.wgsl.js
// Passe GPU : DDA raycast souris → paintData (position 3D du curseur).
// Gère : survol, verrouillage de plan en cours de trait,
//        verrouillage d'axe (Shift), ancrage du trait (mouseJustPressed).
// ============================================================

import { uniformStruct } from '../common/uniforms.wgsl.js';

export const raycastWgslCode = uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> paintData: array<f32>;

fn getVoxel(x: i32, y: i32, z: i32) -> u32 {
    let gx = i32(u.gridX); let gy = i32(u.gridY); let gz = i32(u.gridZ);
    if (x < 0 || x >= gx || y < 0 || y >= gy || z < 0 || z >= gz) { return 0u; }
    return atomicLoad(&grid[x + y * gx + z * gx * gy]) & 0xFu;
}

struct RayHit { pos: vec3<f32>, hit: f32, t: f32 };

// DDA générique : parcourt la grille depuis ro le long de rd et s'arrête
// sur le premier voxel plein rencontré. maxT <= 0.0 = distance illimitée,
// sinon on abandonne dès qu'on dépasse maxT.
fn marchGrid(ro: vec3<f32>, rd: vec3<f32>, maxT: f32) -> RayHit {
    var mapPos = vec3<i32>(floor(ro));
    let deltaDist = abs(vec3<f32>(length(rd)) / rd);
    let rayStep = vec3<i32>(sign(rd));
    var sideDist = (sign(rd) * (vec3<f32>(mapPos) - ro) + (sign(rd) * 0.5) + 0.5) * deltaDist;
    var t = 0.0;
    for (var i = 0; i < 1500; i++) {
        if (maxT > 0.0 && t > maxT) { break; }
        if (getVoxel(mapPos.x, mapPos.y, mapPos.z) > 0u) { return RayHit(ro + rd * t, 1.0, t); }
        if (sideDist.x < sideDist.y) {
            if (sideDist.x < sideDist.z) { sideDist.x += deltaDist.x; mapPos.x += rayStep.x; t = sideDist.x - deltaDist.x; }
            else { sideDist.z += deltaDist.z; mapPos.z += rayStep.z; t = sideDist.z - deltaDist.z; }
        } else {
            if (sideDist.y < sideDist.z) { sideDist.y += deltaDist.y; mapPos.y += rayStep.y; t = sideDist.y - deltaDist.y; }
            else { sideDist.z += deltaDist.z; mapPos.z += rayStep.z; t = sideDist.z - deltaDist.z; }
        }
    }
    return RayHit(ro + rd * t, 0.0, t);
}

@compute @workgroup_size(1)
fn raycastMain() {
    let ro = vec3<f32>(u.rayOriginX, u.rayOriginY, u.rayOriginZ);
    let rd = vec3<f32>(u.rayDirX, u.rayDirY, u.rayDirZ);
    let camFwd = vec3<f32>(u.camFwdX, u.camFwdY, u.camFwdZ);

    var hitPos = ro;
    var hit = 0.0;
    var t = 0.0;

    // Trait en cours (pas le tout premier instant du clic) :
    // on reste sur le plan de profondeur fixé au clic, pour ne pas être bloqué
    // par la matière fraîchement peinte (sinon le pinceau "rebondit").
    if (u.mouseDown > 0.5 && u.mouseJustPressed < 0.5) {
        let lockedPos = vec3<f32>(paintData[0], paintData[1], paintData[2]);
        let denom = dot(rd, camFwd);
        if (abs(denom) > 0.001) {
            t = dot(lockedPos - ro, camFwd) / denom;
            hitPos = ro + rd * t;
        } else {
            hitPos = lockedPos;
            t = length(lockedPos - ro);
        }
        // Précision : si une surface visible est plus proche, on y colle.
        // CORRECTION : On demande au rayon de s'arrêter BIEN AVANT la zone de peinture
        // u.brushSize * 1.8 couvre la taille d'une sphère, mais aussi les angles d'un cube !
        let surfaceMargin = (u.brushSize * 1.8) + 3.0; 
        let closerSurface = marchGrid(ro, rd, t - surfaceMargin);
        if (closerSurface.hit > 0.5) { hitPos = closerSurface.pos; }

        // Verrouillage d'axe (Shift) : ligne droite sur l'axe dominant.
        if (u.axisLock > 0.5) {
            let anchor = vec3<f32>(paintData[4], paintData[5], paintData[6]);
            let delta = hitPos - anchor;
            let ax = abs(delta.x); let ay = abs(delta.y); let az = abs(delta.z);
            if (ax >= ay && ax >= az) { hitPos.y = anchor.y; hitPos.z = anchor.z; }
            else if (ay >= ax && ay >= az) { hitPos.x = anchor.x; hitPos.z = anchor.z; }
            else { hitPos.x = anchor.x; hitPos.y = anchor.y; }
        }
        paintData[0] = hitPos.x; paintData[1] = hitPos.y; paintData[2] = hitPos.z;
        return;
    }

    // Survol ou premier instant du clic : scan de la vraie surface.
    var mapPos = vec3<i32>(floor(ro));
    let deltaDist = abs(vec3<f32>(length(rd)) / rd);
    let rayStep = vec3<i32>(sign(rd));
    var sideDist = (sign(rd) * (vec3<f32>(mapPos) - ro) + (sign(rd) * 0.5) + 0.5) * deltaDist;

    for (var i = 0; i < 1500; i++) {
        if (getVoxel(mapPos.x, mapPos.y, mapPos.z) > 0u) { hit = 1.0; hitPos = ro + rd * t; break; }
        if (sideDist.x < sideDist.y) {
            if (sideDist.x < sideDist.z) { sideDist.x += deltaDist.x; mapPos.x += rayStep.x; t = sideDist.x - deltaDist.x; }
            else { sideDist.z += deltaDist.z; mapPos.z += rayStep.z; t = sideDist.z - deltaDist.z; }
        } else {
            if (sideDist.y < sideDist.z) { sideDist.y += deltaDist.y; mapPos.y += rayStep.y; t = sideDist.y - deltaDist.y; }
            else { sideDist.z += deltaDist.z; mapPos.z += rayStep.z; t = sideDist.z - deltaDist.z; }
        }
    }

    if (hit == 0.0) {
        let maxDim = max(max(u.gridX, u.gridY), u.gridZ);
        
        var D = maxDim * u.camZoom;
        if (u.isOrtho > 0.5) { D = maxDim * 2.0; }
        
        D = D + (u.brushDepth - 0.5) * maxDim;
        let denom = dot(rd, camFwd);
        if (abs(denom) > 0.001) { t = D / denom; hitPos = ro + rd * t; }
    }

    paintData[0] = hitPos.x; paintData[1] = hitPos.y; paintData[2] = hitPos.z; paintData[3] = hit;

    // Premier instant du clic : on fige ce point comme ancre du trait (Shift).
    if (u.mouseJustPressed > 0.5) {
        paintData[4] = hitPos.x; paintData[5] = hitPos.y; paintData[6] = hitPos.z;
    }
}
`;
