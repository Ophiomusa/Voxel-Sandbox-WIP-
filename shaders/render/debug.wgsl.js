// ============================================================
// shaders/render/debug.wgsl.js
// Pipeline de debug : wireframe bounding box + gizmo sphère/cube/torus
// + ligne de projection du curseur sur le sol.
// 222 vertices total (line-list).
// ============================================================

import { uniformStruct } from '../common/uniforms.wgsl.js';

export const debugWgslCode = uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> grid: array<u32>;
@group(0) @binding(2) var<storage, read> paintData: array<f32>;
@group(0) @binding(3) var<storage, read> colliders: array<vec4<f32>>;

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) col: vec3<f32>
};

@vertex
fn vertexMain(@builtin(vertex_index) id: u32) -> VertexOutput {
    var out: VertexOutput;
    var wPos = vec3<f32>(0.0);
    var wCol = vec3<f32>(0.0);
    let gx = u.gridX; let gy = u.gridY; let gz = u.gridZ;

    // --- Bounding box de la grille (24 segments) ---
    if (id < 24u) {
        var box = array<vec3<f32>, 24>(
            vec3(0.,0.,0.), vec3(1.,0.,0.), vec3(1.,0.,0.), vec3(1.,0.,1.),
            vec3(1.,0.,1.), vec3(0.,0.,1.), vec3(0.,0.,1.), vec3(0.,0.,0.),
            vec3(0.,1.,0.), vec3(1.,1.,0.), vec3(1.,1.,0.), vec3(1.,1.,1.),
            vec3(1.,1.,1.), vec3(0.,1.,1.), vec3(0.,1.,1.), vec3(0.,1.,0.),
            vec3(0.,0.,0.), vec3(0.,1.,0.), vec3(1.,0.,0.), vec3(1.,1.,0.),
            vec3(1.,0.,1.), vec3(1.,1.,1.), vec3(0.,0.,1.), vec3(0.,1.,1.)
        );
        wPos = box[id] * vec3<f32>(gx, gy, gz);
        wCol = vec3<f32>(0.3, 0.3, 0.35);

    // --- Gizmo curseur : sphère (192 segments) ou cube (24) ou torus (128+64) ---
    } else if (id < 216u) {
        let cId = id - 24u;
        var r = select(u.brushSize, max(u.brushSize, u.forceRadius), u.mouseActive > 0.5 && u.forceType > 0.5);

        if (u.forceShape == 0.0) {
            // Sphère : 3 cercles orthogonaux
            let axis = cId / 64u; let seg = (cId % 64u) / 2u; let isEnd = cId % 2u;
            let angle = (f32(seg + isEnd) / 32.0) * 6.2831853;
            var offset = vec3<f32>(0.0);
            if (axis == 0u)      { offset = vec3<f32>(0.0, cos(angle), sin(angle)) * r; }
            else if (axis == 1u) { offset = vec3<f32>(cos(angle), 0.0, sin(angle)) * r; }
            else                 { offset = vec3<f32>(cos(angle), sin(angle), 0.0) * r; }
            wPos = vec3<f32>(paintData[0], paintData[1], paintData[2]) + offset;

        } else if (u.forceShape == 1.0) {
            // Cube wireframe
            if (cId < 24u) {
                var cubeBox = array<vec3<f32>, 24>(
                    vec3(-1.,-1.,-1.), vec3(1.,-1.,-1.), vec3(1.,-1.,-1.), vec3(1.,-1.,1.),
                    vec3(1.,-1.,1.),  vec3(-1.,-1.,1.), vec3(-1.,-1.,1.), vec3(-1.,-1.,-1.),
                    vec3(-1.,1.,-1.), vec3(1.,1.,-1.),  vec3(1.,1.,-1.),  vec3(1.,1.,1.),
                    vec3(1.,1.,1.),   vec3(-1.,1.,1.),  vec3(-1.,1.,1.),  vec3(-1.,1.,-1.),
                    vec3(-1.,-1.,-1.),vec3(-1.,1.,-1.), vec3(1.,-1.,-1.), vec3(1.,1.,-1.),
                    vec3(1.,-1.,1.),  vec3(1.,1.,1.),   vec3(-1.,-1.,1.), vec3(-1.,1.,1.)
                );
                wPos = vec3<f32>(paintData[0], paintData[1], paintData[2]) + cubeBox[cId] * r;
            } else {
                out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0); return out;
            }

        } else if (u.forceShape == 2.0) {
            // Torus
            let R_major = r * 0.7; let r_minor = r * 0.3;
            if (cId < 64u) {
                let seg = cId / 2u; let isEnd = cId % 2u;
                let angle = (f32(seg + isEnd) / 32.0) * 6.2831853;
                wPos = vec3<f32>(paintData[0], paintData[1], paintData[2]) +
                    vec3<f32>(cos(angle) * R_major, 0.0, sin(angle) * R_major);
            } else {
                let tId = cId - 64u;
                let circleIdx = tId / 32u;
                let circleSeg = (tId % 32u) / 2u; let circleIsEnd = tId % 2u;
                let minorAngle = (f32(circleSeg + circleIsEnd) / 16.0) * 6.2831853;
                let majorAngle = f32(circleIdx) * 1.570796325;
                let tubeCenter = vec3<f32>(cos(majorAngle) * R_major, 0.0, sin(majorAngle) * R_major);
                let tubeOffset = vec3<f32>(
                    cos(majorAngle) * cos(minorAngle) * r_minor,
                    sin(minorAngle) * r_minor,
                    sin(majorAngle) * cos(minorAngle) * r_minor
                );
                wPos = vec3<f32>(paintData[0], paintData[1], paintData[2]) + tubeCenter + tubeOffset;
            }
        }

        // Couleur du gizmo selon l'état
        if (u.mouseActive > 0.5) {
            if (u.axisLock > 0.5) { wCol = vec3<f32>(1.0, 0.95, 0.1); }         // jaune = axe verrouillé
            else { wCol = select(vec3<f32>(0.1, 0.9, 0.2), vec3<f32>(1.0, 0.2, 0.2), u.forceType > 0.5); }
        } else { wCol = vec3<f32>(0.2, 0.5, 1.0); } // bleu = survol

    // --- Ligne de projection au sol (6 vertices = 3 segments) ---
    } else if (id < 222u) {
        let dId = id - 216u;
        let ppX = paintData[0]; let ppY = paintData[1]; let ppZ = paintData[2];
        if      (dId == 0u) { wPos = vec3<f32>(ppX, ppY, ppZ); }
        else if (dId == 1u) { wPos = vec3<f32>(ppX, 0.0, ppZ); }
        else if (dId == 2u) { wPos = vec3<f32>(ppX - 5.0, 0.0, ppZ); }
        else if (dId == 3u) { wPos = vec3<f32>(ppX + 5.0, 0.0, ppZ); }
        else if (dId == 4u) { wPos = vec3<f32>(ppX, 0.0, ppZ - 5.0); }
        else                { wPos = vec3<f32>(ppX, 0.0, ppZ + 5.0); }
        wCol = vec3<f32>(1.0, 0.6, 0.1); // orange

    // --- GRILLE CENTRALE DU MONDE (84 vertices) ---
    } else if (id < 306u) {
        let lineId = id - 222u;
        let isX = lineId < 42u;
        let lineNum = f32(select((lineId - 42u) / 2u, lineId / 2u, isX)) - 10.0;
        let isEnd = f32(lineId % 2u);
        
        let cx = gx * 0.5; let cz = gz * 0.5;
        let step = 10.0;
        let size = 100.0;
        
        if (isX) {
            wPos = vec3<f32>(cx + lineNum * step, 1.0, cz + select(-size, size, isEnd > 0.5));
        } else {
            wPos = vec3<f32>(cx + select(-size, size, isEnd > 0.5), 1.0, cz + lineNum * step);
        }
        wCol = vec3<f32>(0.2, 0.2, 0.2);
        if (lineNum == 0.0) { wCol = vec3<f32>(0.5, 0.1, 0.1); }

    // --- Colliders wireframe : 3 cercles orthogonaux par sphère (192 vertices/ch) ---
    } else if (id < 222u + 192u * 100u) {
        let cOff = id - 222u;
        let ci = cOff / 192u;          // index du collider
        let localId = cOff % 192u;     // vertex dans ce collider
        let data = colliders[ci];
        if (data.w <= 0.0) { out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0); return out; }

        let center = vec3<f32>(data.x, data.y, data.z);
        let r = data.w;
        let axis = localId / 64u;
        let seg = (localId % 64u) / 2u;
        let isEnd = localId % 2u;
        let angle = (f32(seg + isEnd) / 32.0) * 6.2831853;
        var offset = vec3<f32>(0.0);
        if (axis == 0u)      { offset = vec3<f32>(0.0, cos(angle), sin(angle)) * r; }
        else if (axis == 1u) { offset = vec3<f32>(cos(angle), 0.0, sin(angle)) * r; }
        else                 { offset = vec3<f32>(cos(angle), sin(angle), 0.0) * r; }
        wPos = center + offset;
        wCol = vec3<f32>(1.0, 0.3, 0.3); // rouge
    }

    // --- Transformation caméra commune ---
    var p = wPos - vec3<f32>(u.camTargetX, u.camTargetY, u.camTargetZ);
    let sX = u.camSinX; let cX = u.camCosX;
    let xz = vec2<f32>(cX * p.x - sX * p.z, sX * p.x + cX * p.z); p.x = xz.x; p.z = xz.y;
    let sY = u.camSinY; let cY = u.camCosY;
    let yz = vec2<f32>(cY * p.y - sY * p.z, sY * p.y + cY * p.z); p.y = yz.x; p.z = yz.y;

    let maxDim = max(max(gx, gy), gz);
    p.z -= maxDim * u.camZoom;
    if (p.z > -0.1) { out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0); return out; }

    let zFar = maxDim * 10.0; let zNear = 0.1;
    if (u.isOrtho > 0.5) {
        let orthoScale = maxDim * u.camZoom * 0.5;
        out.pos = vec4<f32>(p.x / (orthoScale * (u.resX / u.resY)), p.y / orthoScale, -p.z / zFar, 1.0);
    } else {
        out.pos = vec4<f32>(
            (p.x * 1.5) / (u.resX / u.resY), p.y * 1.5,
            -p.z * (zFar / (zFar - zNear)) - (zFar * zNear / (zFar - zNear)),
            -p.z
        );
    }
    out.col = wCol;
    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(in.col, 1.0);
}
`;
