import { uniformStruct } from '../common/uniforms.wgsl.js';

export const postWgslCode = uniformStruct + /* wgsl */`
@group(0) @binding(0) var colorTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(3) var<uniform> u: Uniforms;

struct VertexOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>
};

@vertex
fn vertexMain(@builtin(vertex_index) id: u32) -> VertexOutput {
    var out: VertexOutput;
    let u_coord = f32((id << 1u) & 2u);
    let v_coord = f32(id & 2u);
    out.uv = vec2<f32>(u_coord, v_coord);
    out.pos = vec4<f32>(u_coord * 2.0 - 1.0, 1.0 - v_coord * 2.0, 0.0, 1.0);
    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    let pCoord = vec2<i32>(in.pos.xy);
    let baseColor = textureLoad(colorTex, pCoord, 0).rgb;
    let mode = i32(round(u.postMode));

    if (mode == 2) {
        // --- MODE Z-DEPTH CORRECT ---
        let d = textureLoad(depthTex, pCoord, 0);
        if (d >= 1.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }
        
        let maxDim = max(max(u.gridX, u.gridY), u.gridZ);
        let zNear = 0.1;
        let zFar = maxDim * 10.0;
        
        let linearZ = (zNear * zFar) / (zFar - d * (zFar - zNear));
        
        let focusDist = maxDim * u.camZoom;
        let depthVis = clamp(linearZ / (focusDist + maxDim), 0.0, 1.0);
        
        let dCol = mix(vec3<f32>(1.0, 0.2, 0.0), vec3<f32>(0.0, 0.5, 1.0), depthVis);
        return vec4<f32>(dCol, 1.0);
    }

    // Modes Soleil, Brut et Normales (Déjà calculés en 3D !)
    return vec4<f32>(baseColor, 1.0);
}
`;
