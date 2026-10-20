// ============================================================
// shaders/physics/physics.wgsl.js
// ============================================================

import { uniformStruct } from '../common/uniforms.wgsl.js';

export function getPhysicsWgslCode(features) { return uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> activity: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> activeChunks: array<u32>;
@group(0) @binding(4) var<storage, read_write> indirectArgs: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> paintData: array<f32>;
@group(0) @binding(6) var<storage, read> colliders: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> soundData: array<atomic<u32>>;

fn getIndex(x: i32, y: i32, z: i32) -> i32 {
    let gx = i32(u.gridX); let gy = i32(u.gridY); let gz = i32(u.gridZ);
    if (x < 0 || x >= gx || y < 0 || y >= gy || z < 0 || z >= gz) { return -1; }
    return x + y * gx + z * gx * gy;
}

fn getChunkIdx(x: i32, y: i32, z: i32) -> u32 {
    let cResX = (u32(u.gridX) + 7u) >> 3u;
    let cResY = (u32(u.gridY) + 7u) >> 3u;
    let cResZ = (u32(u.gridZ) + 7u) >> 3u;
    let cx = u32(x) >> 3u; let cy = u32(y) >> 3u; let cz = u32(z) >> 3u;
    if (cx < cResX && cy < cResY && cz < cResZ) {
        return cx + cy * cResX + cz * cResX * cResY;
    }
    return 0xFFFFFFFFu;
}

fn wakeUpChunk(cIdx: u32) {
    if (cIdx == 0xFFFFFFFFu) { return; }
    let newFrame = (u.frame + 5u) & 0xFFFFFu;
    var expected = atomicLoad(&activity[cIdx]);
    if ((expected & 0xFFFFFu) >= newFrame) { return; }
    
    loop {
        let curEnergy = expected >> 20u;
        let curFrame = expected & 0xFFFFFu;
        let desired = (curEnergy << 20u) | max(curFrame, newFrame);
        let res = atomicCompareExchangeWeak(&activity[cIdx], expected, desired);
        if (res.exchanged) { break; }
        expected = res.old_value;
    }
}

fn wakeUp(x: i32, y: i32, z: i32) {
    wakeUpChunk(getChunkIdx(x, y, z));
}

fn wakeUpWithEnergy(x: i32, y: i32, z: i32, addedEnergy: u32) {
    let cResX = (u32(u.gridX) + 7u) >> 3u;
    let cResY = (u32(u.gridY) + 7u) >> 3u;
    let cResZ = (u32(u.gridZ) + 7u) >> 3u;
    let cx = u32(x) >> 3u; let cy = u32(y) >> 3u; let cz = u32(z) >> 3u;
    if (cx < cResX && cy < cResY && cz < cResZ) {
        let cIdx = cx + cy * cResX + cz * cResX * cResY;
        let newFrame = (u.frame + 5u) & 0xFFFFFu;
        var expected = atomicLoad(&activity[cIdx]);
        
        loop {
            let curEnergy = expected >> 20u;
            let curFrame = expected & 0xFFFFFu;
            let nextEnergy = min(curEnergy + addedEnergy, 4095u); // Plafond à 12 bits
            let nextFrame = max(curFrame, newFrame);
            let desired = (nextEnergy << 20u) | nextFrame;
            let res = atomicCompareExchangeWeak(&activity[cIdx], expected, desired);
            if (res.exchanged) { break; }
            expected = res.old_value;
        }
    }
}

fn doMove(src_idx: i32, dst_idx: i32, sx: i32, sy: i32, sz: i32, tx: i32, ty: i32, tz: i32, packedVal: u32) -> bool {
    if (dst_idx == -1) { return false; }
    
    let targetRaw = atomicLoad(&grid[dst_idx]);
    let targetMatId = targetRaw & 0xFu;
    let myMatId = packedVal & 0xFu;

    // Cas 1 : La case est vide (Air)
    if (targetMatId == 0u) {
        let res = atomicCompareExchangeWeak(&grid[dst_idx], 0u, packedVal);
        if (res.exchanged) {
            atomicStore(&grid[src_idx], 0u);
            if (myMatId < 5u) { atomicAdd(&soundData[myMatId], 1u); }
                // DÉDUPLICATION DES RÉVEILS
                var chunks = array<u32, 8>(
                    getChunkIdx(sx, sy, sz), getChunkIdx(tx, ty, tz),
                    getChunkIdx(sx, sy + 1, sz), getChunkIdx(sx - 1, sy, sz),
                    getChunkIdx(sx + 1, sy, sz), getChunkIdx(sx, sy - 1, sz),
                    getChunkIdx(sx, sy, sz - 1), getChunkIdx(sx, sy, sz + 1)
                );
                for (var i = 0u; i < 8u; i = i + 1u) {
                    let c = chunks[i];
                    if (c == 0xFFFFFFFFu) { continue; }
                    var is_unique = true;
                    for (var j = 0u; j < i; j = j + 1u) {
                        if (c == chunks[j]) { is_unique = false; break; }
                    }
                    if (is_unique) { wakeUpChunk(c); }
                }
                return true;
        }
    } 
    // Cas 2 : Test de Densité (Archimède)
    else if (targetMatId != 1u) { 
        if (myMatId == targetMatId) { return false; } 
        let myDensity = u.matParams[myMatId * 2u + 1u].z;
        let targetDensity = u.matParams[targetMatId * 2u + 1u].z;
        
        var canSwap = false;
        if (ty - sy < 0) { canSwap = myDensity > targetDensity; } 
        else if (ty - sy > 0) { canSwap = myDensity < targetDensity; } 
        else { canSwap = myDensity > targetDensity; }
        
        if (canSwap) {
            let res = atomicCompareExchangeWeak(&grid[dst_idx], targetRaw, packedVal);
            if (res.exchanged) {
                atomicStore(&grid[src_idx], targetRaw);
                if (myMatId < 5u) { atomicAdd(&soundData[myMatId], 1u); }
                // DÉDUPLICATION DES RÉVEILS
                var chunks = array<u32, 8>(
                    getChunkIdx(sx, sy, sz), getChunkIdx(tx, ty, tz),
                    getChunkIdx(sx, sy + 1, sz), getChunkIdx(sx - 1, sy, sz),
                    getChunkIdx(sx + 1, sy, sz), getChunkIdx(sx, sy - 1, sz),
                    getChunkIdx(sx, sy, sz - 1), getChunkIdx(sx, sy, sz + 1)
                );
                for (var i = 0u; i < 8u; i = i + 1u) {
                    let c = chunks[i];
                    if (c == 0xFFFFFFFFu) { continue; }
                    var is_unique = true;
                    for (var j = 0u; j < i; j = j + 1u) {
                        if (c == chunks[j]) { is_unique = false; break; }
                    }
                    if (is_unique) { wakeUpChunk(c); }
                }
                return true;
            }
        }
    }
    return false;
}

fn hash(n: u32) -> u32 {
    var x = n;
    x = x ^ (x >> 16); x = x * 0x7feb352du;
    x = x ^ (x >> 15); x = x * 0x846ca68bu;
    x = x ^ (x >> 16);
    return x;
}

fn gumbelNoise(seed: u32) -> f32 {
    let h = (f32(hash(seed)) + 0.5) / 4294967296.0;
    return -log(-log(max(h, 1e-7)));
}

// --- Collecte des chunks actifs ---
@compute @workgroup_size(64)
fn collectChunksMain(@builtin(global_invocation_id) id: vec3<u32>) {
    let cResX = (u32(u.gridX) + 7u) >> 3u;
    let cResY = (u32(u.gridY) + 7u) >> 3u;
    let cResZ = (u32(u.gridZ) + 7u) >> 3u;
    let cIdx = id.x;
    if (cIdx >= cResX * cResY * cResZ) { return; }

    let cx = cIdx % cResX; let cy = (cIdx / cResX) % cResY; let cz = cIdx / (cResX * cResY);
    let chunkCenter = vec3<f32>(f32(cx) * 8.0 + 4.0, f32(cy) * 8.0 + 4.0, f32(cz) * 8.0 + 4.0);
    let paintPos = vec3<f32>(paintData[0], paintData[1], paintData[2]);
    var forceWake = false;

    if (u.mouseActive > 0.5) {
        var forceDist = max(u.brushSize, u.forceRadius) + 8.0;
        if (u.forceShape == 1.0) { forceDist = forceDist * 1.74; }
        if (distance(chunkCenter, paintPos) <= forceDist) { forceWake = true; }
    }

    let act_raw = atomicLoad(&activity[cIdx]);
    var act = act_raw;
    let frameDeadline = act & 0xFFFFFu;
    let energy = act >> 20u;
    let currentFrame = u.frame & 0xFFFFFu;

    // --- OPTIMISATION 2 : RÉVEIL GLOBAL DU CHUNK ---
    if (forceWake) {
        let newFrame = (currentFrame + 5u) & 0xFFFFFu;
        var expectedWake = act;
        
        if ((expectedWake & 0xFFFFFu) < newFrame) {
            loop {
                let curEnergy = expectedWake >> 20u;
                let curFrame = expectedWake & 0xFFFFFu;
                let desired = (curEnergy << 20u) | max(curFrame, newFrame);
                let res = atomicCompareExchangeWeak(&activity[cIdx], expectedWake, desired);
                if (res.exchanged) { 
                    act = desired;
                    break; 
                }
                expectedWake = res.old_value;
            }
        }
    }
    // -----------------------------------------------

    // --- Dissipation et propagation de l'énergie (Macro-turbulence) ---
    if (energy > 0u) {
        let nextEnergy = u32(f32(energy) * 0.8); // 80% conservé
        var expected = act;
        loop {
            let curFrame = expected & 0xFFFFFu;
            let desired = (nextEnergy << 20u) | curFrame;
            let res = atomicCompareExchangeWeak(&activity[cIdx], expected, desired);
            if (res.exchanged) { break; }
            expected = res.old_value;
        }
        
        // 20% divisés par 6 directions
        let spread = (energy - nextEnergy) / 6u; 
        if (spread > 0u) {
            let bx = i32(cx * 8u + 4u); let by = i32(cy * 8u + 4u); let bz = i32(cz * 8u + 4u);
            wakeUpWithEnergy(bx + 8, by, bz, spread);
            wakeUpWithEnergy(bx - 8, by, bz, spread);
            wakeUpWithEnergy(bx, by + 8, bz, spread);
            wakeUpWithEnergy(bx, by - 8, bz, spread);
            wakeUpWithEnergy(bx, by, bz + 8, spread);
            wakeUpWithEnergy(bx, by, bz - 8, spread);
        }
    }

    // Le chunk est actif si la frame est bonne, si on force (souris), ou s'il y a de l'énergie résiduelle
    if (frameDeadline >= currentFrame || forceWake || energy > 5u) {
        let listPos = atomicAdd(&indirectArgs[0], 1u);
        activeChunks[listPos] = cIdx;
    }
}

// --- Simulation physique ---
@compute @workgroup_size(8, 8, 4)
fn computeMain(
    @builtin(workgroup_id) workgroup_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let chunkListIdx = workgroup_id.x;
    let cIdx = activeChunks[chunkListIdx];
    
    // LECTURE DE L'ENERGIE DU CHUNK
    let chunkAct = atomicLoad(&activity[cIdx]);
    let chunkEnergy = chunkAct >> 20u;

    let cResX = (u32(u.gridX) + 7u) >> 3u;
    let cResY = (u32(u.gridY) + 7u) >> 3u;
    let cx = cIdx % cResX; let cy = (cIdx / cResX) % cResY; let cz = cIdx / (cResX * cResY);
    let x = cx * 8u + local_id.x; let y = cy * 8u + local_id.y;
    let offset = (u.frame % 2u + x + y) % 2u;
    let z_active = (cz * 8u) + local_id.z * 2u + offset;
    let gx = u32(u.gridX); let gy = u32(u.gridY); let gz = u32(u.gridZ);

    if (x >= gx || y >= gy) { return; }

    let paintPos = vec3<f32>(paintData[0], paintData[1], paintData[2]);

    if (u.mouseActive > 0.5 && u.tool < 5.0) {
        let z_even = (cz * 8u) + local_id.z * 2u;
        let z_odd  = (cz * 8u) + local_id.z * 2u + 1u;
        let draw_val = u32(u.tool);
        var in_even = false; var in_odd = false;
        let pEven = vec3<f32>(f32(x), f32(y), f32(z_even)) - paintPos;
        let pOdd  = vec3<f32>(f32(x), f32(y), f32(z_odd))  - paintPos;
        let r = u.brushSize;
        if (u.forceShape == 0.0) {
            in_even = (dot(pEven, pEven) <= r * r);
            in_odd  = (dot(pOdd,  pOdd)  <= r * r);
        } else if (u.forceShape == 1.0) {
            in_even = (abs(pEven.x) <= r && abs(pEven.y) <= r && abs(pEven.z) <= r);
            in_odd  = (abs(pOdd.x)  <= r && abs(pOdd.y)  <= r && abs(pOdd.z)  <= r);
        } else if (u.forceShape == 2.0) {
            let R_major = r * 0.7; let r_minor = r * 0.3;
            let qE = vec2<f32>(length(pEven.xz) - R_major, pEven.y);
            let qO = vec2<f32>(length(pOdd.xz)  - R_major, pOdd.y);
            in_even = (dot(qE, qE) <= r_minor * r_minor);
            in_odd  = (dot(qO, qO) <= r_minor * r_minor);
        }
        if (z_even < gz && in_even) {
            atomicStore(&grid[getIndex(i32(x), i32(y), i32(z_even))], draw_val);
        }
        if (z_odd < gz && in_odd) {
            atomicStore(&grid[getIndex(i32(x), i32(y), i32(z_odd))], draw_val);
        }
    }
    if (z_active >= gz) { return; }
    let idx = getIndex(i32(x), i32(y), i32(z_active));
    let rawVal = atomicLoad(&grid[idx]);
    let matId  = rawVal & 0xFu;
    let curDir = (rawVal >> 4u) & 0x1Fu;
    let curVel = (rawVal >> 9u) & 0x7u;
    if (matId == 0u || matId == 1u) { return; }
    let master_hash = hash(x + y * gx + z_active * gx * gy + u.frame);

    // --- Forces Globales (Vortex, Trou Noir, etc.) ---
    if (u.forceType > 0.5 && u.mouseActive > 0.5 && u.forceStrength > 0.0) {
        let voxelPos = vec3<f32>(f32(x), f32(y), f32(z_active));
        let fDir = voxelPos - paintPos;
        let distSq = dot(fDir, fDir);
        var insideForce = false;
        let r_force = u.forceRadius;
        if (u.forceShape == 0.0) {
            insideForce = (distSq <= r_force * r_force);
        } else if (u.forceShape == 1.0) {
            insideForce = (abs(fDir.x) <= r_force && abs(fDir.y) <= r_force && abs(fDir.z) <= r_force);
        } else if (u.forceShape == 2.0) {
            let R_major = r_force * 0.7; let r_minor = r_force * 0.3;
            let q = vec2<f32>(length(fDir.xz) - R_major, fDir.y);
            insideForce = (dot(q, q) <= r_minor * r_minor);
        }
        if (insideForce && distSq > 0.1) {
            var dX = 0.0; var dY = 0.0; var dZ = 0.0;
            let fType = i32(round(u.forceType));
            switch (fType) {
                case 1: { dX = -fDir.y; dY = fDir.x; }
                case 4: { dX = fDir.x; dY = fDir.y; dZ = fDir.z; }
                case 5: { dX = -fDir.x; dY = -fDir.y; dZ = -fDir.z; }
                default: {}
            }
            let inv = inverseSqrt(distSq); let push = u.forceStrength;
            let tx = i32(round(f32(x) + (dX * inv) * push));
            let ty = i32(round(f32(y) + (dY * inv) * push));
            let tz = i32(round(f32(z_active) + (dZ * inv) * push));
            if (doMove(idx, getIndex(tx, ty, tz), i32(x), i32(y), i32(z_active), tx, ty, tz, rawVal)) { return; }
        }
    }

    ${features.collisions ? `
    // --- Collisions ---
    for (var i = 0u; i < arrayLength(&colliders); i = i + 1u) {
        let col = colliders[i];
        if (col.w <= 0.0) { break; }
        let voxelPos = vec3<f32>(f32(x), f32(y), f32(z_active));
        let cDir = voxelPos - col.xyz;
        let distSq = dot(cDir, cDir);
        if (distSq < (col.w * col.w) && distSq > 0.01) {
            let dist = sqrt(distSq);
            let inv = 1.0 / dist;
            let push = col.w - dist + 1.0;
            let tx = i32(round(f32(x) + (cDir.x * inv) * push));
            let ty = i32(round(f32(y) + (cDir.y * inv) * push));
            let tz = i32(round(f32(z_active) + (cDir.z * inv) * push));
            if (doMove(idx, getIndex(tx, ty, tz), i32(x), i32(y), i32(z_active), tx, ty, tz, rawVal)) {
                return;
            }
        }
    }
    ` : ''}

    // ============================================================
    //  UNIFICATION DES MATÉRIAUX (Éditeur Ultime)
    // ============================================================
    if (matId >= 5u) { return; }      
    let p1 = u.matParams[matId * 2u];
    let p2 = u.matParams[matId * 2u + 1u];
    let gravY_raw = p1.x;                    let gravDirY = sign(gravY_raw);         
    let gravForce = abs(gravY_raw);         
    let probDiagBase  = p1.y;
    let probHorizBase = p1.z;
    let visc          = p1.w;         
    let matSplash   = p2.x;
    let matMomentum = p2.y;
    let matMelt     = p2.w; 
    let seed = x + y * gx + z_active * gx * gy + u.frame * (13u + matId);

    // --- LA FONTE PAR IMPACT (THIXOTROPIE) ---
    var effectiveVisc = visc;
    ${features.melt ? `
    if (matMelt > 0.0 && chunkEnergy > 0u) {
        let reduction = f32(chunkEnergy) * (matMelt * 0.05); 
        effectiveVisc = max(0.0, effectiveVisc - reduction);
    }
    ` : ''}

    // ================== MODE GUMBEL-MAX ==================
    if (u.useGumbelMax > 0.5) {
        let dirs = array<vec3<i32>, 27>(
            vec3<i32>(0,0,0),
            vec3<i32>(0,-1,0), vec3<i32>(0,1,0),
            vec3<i32>(-1,0,0), vec3<i32>(1,0,0), vec3<i32>(0,0,-1), vec3<i32>(0,0,1),
            vec3<i32>(-1,-1,0), vec3<i32>(1,-1,0), vec3<i32>(0,-1,-1), vec3<i32>(0,-1,1),
            vec3<i32>(-1,1,0), vec3<i32>(1,1,0), vec3<i32>(0,1,-1), vec3<i32>(0,1,1),
            vec3<i32>(-1,0,-1), vec3<i32>(1,0,-1), vec3<i32>(-1,0,1), vec3<i32>(1,0,1),
            vec3<i32>(-1,-1,-1), vec3<i32>(1,-1,-1), vec3<i32>(-1,1,-1), vec3<i32>(1,1,-1),
            vec3<i32>(-1,-1,1), vec3<i32>(1,-1,1), vec3<i32>(-1,1,1), vec3<i32>(1,1,1)
        );
        var primaryIdx = 0u;
        if (gravDirY == -1.0) { primaryIdx = 1u; } else if (gravDirY == 1.0) { primaryIdx = 2u; }
        let primaryDir = vec3<i32>(0, i32(gravDirY), 0);

        // 1. Chute Libre Totale
        ${features.gravity ? `
        if (primaryIdx != 0u && (hash(seed + 111u) % 100u) < u32(gravForce * 100.0)) {
            let ftx = i32(x) + primaryDir.x; let fty = i32(y) + primaryDir.y; let ftz = i32(z_active) + primaryDir.z;
            let fVel = min(curVel + 1u, 7u);
            let fPacked = matId | (curDir << 4u) | (fVel << 9u);
            if (doMove(idx, getIndex(ftx, fty, ftz), i32(x), i32(y), i32(z_active), ftx, fty, ftz, fPacked)) { return; }
        }
        ` : ''}

        // 2. FREIN VISQUEUX DYNAMIQUE
        let curStuck = (rawVal >> 12u) & 0x7u;
        ${features.viscosity ? `
        if (effectiveVisc > 0.0 && (hash(seed + 123u) % 100u) < u32(effectiveVisc)) { 
            let newStuck = min(curStuck + 1u, 7u);
            atomicStore(&grid[idx], matId | (curDir << 4u) | (curVel << 9u) | (newStuck << 12u));
            return; 
        }
        ` : ''}

        // 3. Splash et Chaos Multiplié
        let splashBoost = ${features.splash ? 'f32(curVel) * matSplash' : '0.0'}; 
        let chaos = ${features.gumbelChaos ? 'min(f32(chunkEnergy) * 0.015, 20.0)' : '0.0'}; 

        if (curStuck < 7u || splashBoost > 0.0 || chaos > 0.5) {
            var bestScores = array<f32, 3>(-1e10, -1e10, -1e10);
            var bestDirs   = array<u32, 3>(0u, 0u, 0u);
            for (var d = 1u; d < 27u; d = d + 1u) {
                if (d == primaryIdx) { continue; }
                let dir = dirs[d];
                let dirF = vec3<f32>(dir);
                let normW = 1.0 / length(dirF);
                
                // --- 1. CORRECTION DU MOUVEMENT PRINCIPAL ---
                var wBase = -10000.0;
                if (gravDirY != 0.0 && dirF.y == -gravDirY) { 
                    wBase = ${features.splash || features.gumbelChaos ? '0.0' : '-10000.0'}; 
                } 
                else if (gravDirY != 0.0 && dirF.y == gravDirY) { 
                    wBase = ${features.diagonalSlip ? 'max(probDiagBase * 0.1, 0.1)' : '-10000.0'}; 
                }
                else { 
                    wBase = ${features.horizontalSpread ? 'probHorizBase * 0.1' : '-10000.0'}; 
                }
                
                if (wBase < -1000.0) { continue; }
                
                let noise = gumbelNoise(seed + d * 1000u);
                let chaosNoise = gumbelNoise(seed + d * 777u) * chaos;
                let effectiveSplash = select(0.0, splashBoost, f32(dir.y) != gravDirY);
                
                var s = wBase * normW + effectiveSplash + noise + chaosNoise;
                
                ${features.inertia ? 'if (d == curDir) { s += matMomentum; }' : ''}
                
                var di = d;
                for (var k = 0u; k < 3u; k = k + 1u) {
                    if (s > bestScores[k]) {
                        let tmpS = bestScores[k]; let tmpD = bestDirs[k];
                        bestScores[k] = s; bestDirs[k] = di;
                        s = tmpS; di = tmpD;
                    }
                }
            }
            for (var k = 0u; k < 3u; k = k + 1u) {
                if (bestDirs[k] == 0u) { continue; }
                let dir = dirs[bestDirs[k]];
                let tx = i32(x) + dir.x; let ty = i32(y) + dir.y; let tz = i32(z_active) + dir.z;
                let splashPacked = matId | (bestDirs[k] << 4u) | (0u << 9u);
                if (doMove(idx, getIndex(tx, ty, tz), i32(x), i32(y), i32(z_active), tx, ty, tz, splashPacked)) {
                    let injectedEnergy = u32(clamp(splashBoost * 0.5, 25.0, 500.0));
                    wakeUpWithEnergy(tx, ty, tz, injectedEnergy);
                    return;
                }
            }
        }

        let newStuck2 = min(curStuck + 1u, 7u);
        if (newStuck2 >= 7u && (u.frame + x + y + z_active) % 4u == 0u) {
            for (var d = 1u; d < 27u; d = d + 1u) {
                if (d == primaryIdx) { continue; }
                let dir = dirs[d];
                let dirF = vec3<f32>(dir);
                // --- 2. CORRECTION DU SYSTÈME ANTI-BLOCAGE ---
                var wBase = ${features.horizontalSpread ? 'probHorizBase' : '-10000.0'};
                if (gravDirY != 0.0 && dirF.y == -gravDirY) { wBase = -10000.0; }
                if (wBase < -1000.0) { continue; }
                
                let tx = i32(x) + dir.x; let ty = i32(y) + dir.y; let tz = i32(z_active) + dir.z;
                let targetIdx = getIndex(tx, ty, tz);
                if (targetIdx != -1 && atomicLoad(&grid[targetIdx]) == 0u) {
                    let packed = matId | (d << 4u) | (0u << 9u);
                    if (doMove(idx, targetIdx, i32(x), i32(y), i32(z_active), tx, ty, tz, packed)) { return; }
                }
            }
        }

        // ---> BLOC EXPÉRIMENTAL (GUMBEL-MAX SEULEMENT) <---
        ${features.experimentalFluid ? `
        if (u.fluidSpreadForce > 0.0 && (hash(seed + 999u) % 100u) < u32(u.fluidSpreadForce)) {
            let mode = i32(u.fluidMode);
            let maxSpeed = i32(u.fluidSpreadSpeed);
            let master_hash = hash(seed + 123u);

            // ============================================================
            // MODE 0 : ÉTALEMENT PLAT HORIZONTAL
            // ============================================================
            if (mode == 0) {
                let downIdx = getIndex(i32(x), i32(y) + i32(gravDirY), i32(z_active));
                if (downIdx != -1 && (atomicLoad(&grid[downIdx]) & 0xFu) != 0u) {
                    let spreadDirs = array<vec2<i32>, 4>(
                        vec2<i32>(1, 0), vec2<i32>(-1, 0), 
                        vec2<i32>(0, 1), vec2<i32>(0, -1)
                    );
                    let startDir = master_hash % 4u;
                    
                    for (var i = 0u; i < 4u; i = i + 1u) {
                        let d = spreadDirs[(startDir + i) % 4u];
                        var validTx: i32 = i32(x);
                        var validTz: i32 = i32(z_active);
                        var canMoveH = false;
                        
                        for (var step = 1; step <= 5; step = step + 1) {
                            if (step > maxSpeed) { break; }
                            let testX = i32(x) + d.x * step;
                            let testZ = i32(z_active) + d.y * step;
                            let testIdx = getIndex(testX, i32(y), testZ);
                            
                            if (testIdx == -1 || (atomicLoad(&grid[testIdx]) & 0xFu) != 0u) { break; }
                            validTx = testX;
                            validTz = testZ;
                            canMoveH = true;
                        }
                        
                        if (canMoveH) {
                            let finalIdx = getIndex(validTx, i32(y), validTz);
                            if (doMove(idx, finalIdx, i32(x), i32(y), i32(z_active), validTx, i32(y), validTz, rawVal)) {
                                return;
                            }
                        }
                    }
                }
            }

            // ============================================================
            // MODE 1 : PENTE DIAGONALE RAPIDE (8 Voisins + Glissement Longue Portée)
            // ============================================================
            if (mode == 1) {
                let neighbors8 = array<vec2<i32>, 8>(
                    vec2<i32>(1, 0),  vec2<i32>(-1, 0), 
                    vec2<i32>(0, 1),  vec2<i32>(0, -1),
                    vec2<i32>(1, 1),  vec2<i32>(-1, 1),
                    vec2<i32>(1, -1), vec2<i32>(-1, -1)
                );
                
                let startIdx = master_hash % 8u;
                let gY = i32(gravDirY);

                for (var i = 0u; i < 8u; i = i + 1u) {
                    let d = neighbors8[(startIdx + i) % 8u];
                    var validTx: i32 = i32(x);
                    var validTy: i32 = i32(y);
                    var validTz: i32 = i32(z_active);
                    var canSlide = false;

                    // Balayage rapide le long de la pente descendante
                    for (var step = 1; step <= 5; step = step + 1) {
                        if (step > maxSpeed) { break; }
                        
                        let testX = i32(x) + d.x * step;
                        let testY = i32(y) + gY * step;
                        let testZ = i32(z_active) + d.y * step;
                        let testIdx = getIndex(testX, testY, testZ);

                        // Si la case en pente est occupée ou hors map -> fin de la glissade
                        if (testIdx == -1 || atomicLoad(&grid[testIdx]) != 0u) {
                            break;
                        }

                        validTx = testX;
                        validTy = testY;
                        validTz = testZ;
                        canSlide = true;
                    }

                    if (canSlide) {
                        let finalIdx = getIndex(validTx, validTy, validTz);
                        if (doMove(idx, finalIdx, i32(x), i32(y), i32(z_active), validTx, validTy, validTz, rawVal)) {
                            return;
                        }
                    }
                }
            }

            // ============================================================
            // MODE 2 : PRESSION HYDROSTATIQUE (100% ENTIERS, ZERO CRASH)
            // ============================================================
            if (mode == 2) {
                var pressure: i32 = 0; 


                // 1. MESURE DE LA COLONNE D'EAU (x) 
                for (var step_h: i32 = 1; step_h <= 8; step_h = step_h + 1) {
                    let upY = i32(y) - i32(gravDirY) * step_h;
                    let upIdx = getIndex(i32(x), upY, i32(z_active));


                    if (upIdx != -1) {
                        let upMat = atomicLoad(&grid[upIdx]) & 0xFu;
                        if (upMat == matId) {
                             pressure = pressure + 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }


                // S'il y a du poids au-dessus
                if (pressure > 0) {
                    // 2. RÉGRESSION LINÉAIRE (y = a * x + b) - Full i32
                    let a_pente: i32 = maxSpeed; 
                    let b_base: i32 = 1;
                    let pushDistance: i32 = (a_pente * pressure) + b_base; 


                    // 3. ÉJECTION PAR "ONDE DE CHOC"
                    let spreadDirs = array<vec2<i32>, 4>(
                        vec2<i32>(1, 0), vec2<i32>(-1, 0), 
                        vec2<i32>(0, 1), vec2<i32>(0, -1)
                    );
                    let startDir = master_hash % 4u;
                    
                    for (var i = 0u; i < 4u; i = i + 1u) {
                        let d = spreadDirs[(startDir + i) % 4u];
                        var validTx: i32 = i32(x);
                        var validTz: i32 = i32(z_active);
                        var canMove = false;


                        for (var step_d: i32 = 1; step_d <= 15; step_d = step_d + 1) {
                            if (step_d > pushDistance) { break; } 
                            
                            let testX = i32(x) + d.x * step_d;
                            let testZ = i32(z_active) + d.y * step_d;
                            let testIdx = getIndex(testX, i32(y), testZ);


                            if (testIdx == -1) { break; }


                            let testMat = atomicLoad(&grid[testIdx]) & 0xFu;
                            
                            if (testMat == 0u) {
                                validTx = testX;
                                validTz = testZ;
                                canMove = true;
                                break; 
                            } else if (testMat != matId) {
                                break;
                            }
                        }


                        if (canMove) {
                            let finalIdx = getIndex(validTx, i32(y), validTz);
                            if (doMove(idx, finalIdx, i32(x), i32(y), i32(z_active), validTx, i32(y), validTz, rawVal)) {
                                return;
                            }
                        }
                    }
                }
            }
        }
        ` : ''}
        // -------------------------------------------------

        atomicStore(&grid[idx], matId | (curDir << 4u) | (curVel << 9u) | (newStuck2 << 12u));
        return;
    }

    // ================== MODE CLASSIQUE ==================
    let side = (master_hash / 1000000u) % 4u;
    var sdx = 0; var sdz = 0;
    if (side == 0u) { sdx = 1; } else if (side == 1u) { sdx = -1; }
    else if (side == 2u) { sdz = 1; } else { sdz = -1; }
    let bx = i32(x); let by = i32(y) + i32(gravDirY); let bz = i32(z_active);
    
    ${features.gravity ? `
    if (gravForce > 0.0 && (hash(seed + 111u) % 100u) < u32(gravForce * 100.0)) {
        if (doMove(idx, getIndex(bx, by, bz), i32(x), i32(y), i32(z_active), bx, by, bz, rawVal)) { return; }
    }
    ` : ''}

    ${features.viscosity ? `
    if (effectiveVisc > 0.0 && (hash(seed + 123u) % 100u) < u32(effectiveVisc)) { return; }
    ` : ''}

    ${features.diagonalSlip ? `
    if (probDiagBase > 0.0 && (hash(seed + 456u) % 100u) < u32(probDiagBase)) {
        let diag1 = getIndex(bx + sdx, by, bz + sdz);
        let diag2 = getIndex(bx - sdx, by, bz - sdz);
        if (doMove(idx, diag1, i32(x), i32(y), i32(z_active), bx + sdx, by, bz + sdz, rawVal)) { return; }
        if (doMove(idx, diag2, i32(x), i32(y), i32(z_active), bx - sdx, by, bz - sdz, rawVal)) { return; }
    }
    ` : ''}

    ${features.horizontalSpread ? `
    if (probHorizBase > 0.0 && (hash(seed + 789u) % 100u) < u32(probHorizBase)) {
        let sdx2 = (master_hash / 100000u) % 2u;
        var sfx = 1; if (sdx2 == 0u) { sfx = -1; }
        let sideL = getIndex(i32(x) + sfx, i32(y), i32(z_active));
        if (doMove(idx, sideL, i32(x), i32(y), i32(z_active), i32(x) + sfx, i32(y), i32(z_active), rawVal)) { return; }
    }
    ` : ''}
    
    return;
}
`;
}