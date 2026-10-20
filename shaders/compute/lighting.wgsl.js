import { uniformStruct } from '../common/uniforms.wgsl.js';

export const lightingWgslCode = uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> grid: array<u32>;
@group(0) @binding(2) var<storage, read> visibleList: array<u32>;
@group(0) @binding(3) var<storage, read_write> lightingBuffer: array<u32>;
@group(0) @binding(4) var<storage, read> drawArgs: array<u32>;

@compute @workgroup_size(256)
fn lightingMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let instance_idx = global_id.x;
    let instance_count = drawArgs[1]; 
    if (instance_idx >= instance_count) { return; }

    let id = visibleList[instance_idx];
    let state = grid[id] & 0xFu;
    if (state == 0u) { return; }

    let gx = i32(u.gridX); let gy = i32(u.gridY); let gz = i32(u.gridZ);
    let vx = i32(id % u32(gx));
    let vy = i32((id / u32(gx)) % u32(gy));
    let vz = i32(id / (u32(gx) * u32(gy)));

    // --- FRUSTUM CULLING : Calcul de la caméra ---
    var p = vec3<f32>(f32(vx), f32(vy), f32(vz)) - vec3<f32>(u.camTargetX, u.camTargetY, u.camTargetZ);
    let sX = u.camSinX; let cX = u.camCosX;
    let xz = vec2<f32>(cX * p.x - sX * p.z, sX * p.x + cX * p.z); p.x = xz.x; p.z = xz.y;
    let sY = u.camSinY; let cY = u.camCosY;
    let yz = vec2<f32>(cY * p.y - sY * p.z, sY * p.y + cY * p.z); p.y = yz.x; p.z = yz.y;

    let maxDim = max(max(f32(gx), f32(gy)), f32(gz));
    p.z -= maxDim * u.camZoom;

    // Si le voxel est derrière la caméra, on saute les calculs d'ombre !
    if (p.z > -0.1) {
        lightingBuffer[instance_idx] = 0u;
        return;
    }
    // ---------------------------------------------

    // 1. CALCUL DE LA NORMALE (Ultra-rapide en 1D)
    var normal = vec3<f32>(0.0, 1.0, 0.0);
    if (vx > 0 && vx < gx - 1 && vy > 0 && vy < gy - 1 && vz > 0 && vz < gz - 1) {
        let nR = f32((grid[id + 1u] & 0xFu) == 0u);
        let nL = f32((grid[id - 1u] & 0xFu) == 0u);
        let nT = f32((grid[id + u32(gx)] & 0xFu) == 0u);
        let nB = f32((grid[id - u32(gx)] & 0xFu) == 0u);
        let nF = f32((grid[id + u32(gx) * u32(gy)] & 0xFu) == 0u);
        let nBa = f32((grid[id - u32(gx) * u32(gy)] & 0xFu) == 0u);
        let rawNorm = vec3<f32>(nR - nL, nT - nB, nF - nBa);
        if (length(rawNorm) > 0.1) { normal = normalize(rawNorm); }
    }

    // Couleur de base = palette utilisateur (matColors[slot 92+])
    let isWall = f32(state == 1u); let isWater = f32(state == 3u); let isGas = f32(state == 4u);
    let colorIdx = clamp(state - 1u, 0u, 3u);
    let baseCol = u.matColors[colorIdx].rgb;
    var transparent = 0.0;
    let mode = i32(round(u.postMode));
    var finalCol = vec3<f32>(0.0);

    // 2. CALCUL DES OMBRES ET DE LA LUMIÈRE
    if (mode == 3) {
        finalCol = normal * 0.5 + 0.5;
    } else if (mode == 1 || mode == 2) {
        finalCol = baseCol;
    } else {
        let sunDir = normalize(vec3<f32>(u.sunDirX, u.sunDirY, u.sunDirZ));
        let diffuseBase = dot(normal, sunDir);
        let viewDir = normalize(vec3<f32>(u.camTargetX, u.camTargetY, u.camTargetZ) - vec3<f32>(f32(vx), f32(vy), f32(vz)));
        var shadow = 1.0;
        var sssLight = vec3<f32>(0.0);

        if (diffuseBase > 0.0 || (isWater > 0.5 && u.labViscosite > 0.5)) {
            var rayPos = vec3<f32>(f32(vx), f32(vy), f32(vz)) + normal * 1.5;
            let stepDir = sunDir * 1.6;
            for (var i = 0; i < 8; i++) {
                let rx = i32(round(rayPos.x)); let ry = i32(round(rayPos.y)); let rz = i32(round(rayPos.z));
                if (ry >= gy) { break; }
                if (rx < 0 || rx >= gx || ry < 0 || rz < 0 || rz >= gz) { break; }
                let hitMat = grid[rx + ry * gx + rz * gx * gy] & 0xFu;
                if (hitMat != 0u) {
                    if (hitMat == 3u && u.labViscosite > 0.5) {
                        sssLight += u.matColors[2u].rgb * vec3<f32>(0.3, 0.53, 0.44);
                    } else { shadow = 0.15; break; }
                }
                rayPos += stepDir;
            }
        }
        let diffuse = max(diffuseBase, 0.0) * shadow;

        if (isWater > 0.5 && u.labViscosite > 0.5) {
            let fresnel = clamp(1.0 - max(dot(normal, viewDir), 0.0), 0.0, 1.0);
            let surfaceCol = mix(baseCol * 0.8, vec3<f32>(0.8, 0.95, 1.0), pow(fresnel, 2.0));
            let halfVector = normalize(sunDir + viewDir);
            let spec = pow(max(dot(normal, halfVector), 0.0), 128.0) * 2.5 * shadow;
            finalCol = surfaceCol * (0.35 + diffuse * 0.65) + sssLight + vec3<f32>(spec);
            transparent = max(0.01, u.waterOpacity);
        } else {
            finalCol = baseCol * (0.35 + diffuse * 0.65) + sssLight;
        }
    }

    // 3. SÉCURITÉ ET COMPRESSION DE LA COULEUR
    let safeColor = min(max(finalCol, vec3<f32>(0.0)), vec3<f32>(1.0));
    let safeAlpha = clamp(transparent, 0.0, 1.0);
    lightingBuffer[instance_idx] = pack4x8unorm(vec4<f32>(safeColor, safeAlpha));
}
`;
