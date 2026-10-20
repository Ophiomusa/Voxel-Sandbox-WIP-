import { uniformStruct } from '../common/uniforms.wgsl.js';

export const renderWgslCode = uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> grid: array<u32>;
@group(0) @binding(3) var<storage, read> visibleList: array<u32>;
@group(0) @binding(4) var<storage, read> lightingBuffer: array<u32>;

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) col: vec3<f32>,
    @location(1) transparent: f32
}

@vertex
fn vertexMain(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOutput {
    var out: VertexOutput;
    
    let id = visibleList[iid];
    let state = grid[id] & 0xFu;
    if (state == 0u) { out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0); return out; }
    
    let gx = i32(u.gridX); let gy = i32(u.gridY); let gz = i32(u.gridZ);
    let vx = i32(id % u32(gx)); 
    let vy = i32((id / u32(gx)) % u32(gy)); 
    let vz = i32(id / (u32(gx) * u32(gy)));

    // 1. POSITIONNEMENT ET PERSPECTIVE
    var p = vec3<f32>(f32(vx), f32(vy), f32(vz)) - vec3<f32>(u.camTargetX, u.camTargetY, u.camTargetZ);
    let sX = u.camSinX; let cX = u.camCosX;
    let xz = vec2<f32>(cX * p.x - sX * p.z, sX * p.x + cX * p.z); p.x = xz.x; p.z = xz.y;
    let sY = u.camSinY; let cY = u.camCosY;
    let yz = vec2<f32>(cY * p.y - sY * p.z, sY * p.y + cY * p.z); p.y = yz.x; p.z = yz.y;

    var quad = array<vec2<f32>, 6>(
        vec2<f32>(-0.5, -0.5), vec2<f32>(0.5, -0.5), vec2<f32>(-0.5, 0.5),
        vec2<f32>(0.5, -0.5), vec2<f32>(0.5, 0.5), vec2<f32>(-0.5, 0.5)
    );
    p.x += quad[vid].x * 1.05; 
    p.y += quad[vid].y * 1.05;

    let maxDim = max(max(f32(gx), f32(gy)), f32(gz));
    p.z -= maxDim * u.camZoom;
    
    if (p.z > -0.1) { out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0); return out; }

    let zFar = maxDim * 10.0; let zNear = 0.1;
    if (u.isOrtho > 0.5) {
        let orthoScale = maxDim * u.camZoom * 0.5;
        out.pos = vec4<f32>(p.x / (orthoScale * (u.resX / u.resY)), p.y / orthoScale, -p.z / zFar, 1.0);
    } else {
        out.pos = vec4<f32>((p.x * 1.5) / (u.resX / u.resY), p.y * 1.5, -p.z * (zFar / (zFar - zNear)) - (zFar * zNear / (zFar - zNear)), -p.z);
    }

    // 2. DÉCOMPRESSION DE LA COULEUR
    let packedColor = lightingBuffer[iid];
    let unpacked = unpack4x8unorm(packedColor);
    out.col = unpacked.rgb;
    out.transparent = unpacked.a;

    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    if (in.transparent > 0.0 && in.transparent < 0.99) {
        let px = u32(in.pos.x) % 4u;
        let py = u32(in.pos.y) % 4u;
        let bayer = array<f32, 16>(
            0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
            12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
            3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
            15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
        );
        let threshold = bayer[px + py * 4u];
        if (in.transparent <= threshold) { discard; }
    }
    return vec4<f32>(in.col, 1.0);
}
`;
