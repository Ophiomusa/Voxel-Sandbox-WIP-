import { uniformStruct } from '../common/uniforms.wgsl.js';
import { config } from '../../config.js';

export function buildCompactShader() {
  return uniformStruct + /* wgsl */`
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> grid: array<u32>;
@group(0) @binding(2) var<storage, read_write> visibleList: array<u32>;
@group(0) @binding(3) var<storage, read_write> drawArgs: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> lightDispatch: array<atomic<u32>>;

@compute @workgroup_size(256) fn compactMain(
    @builtin(workgroup_id) wg_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let total = u32(u.gridX) * u32(u.gridY) * u32(u.gridZ);
    let flatWG = wg_id.x + wg_id.y * ${config.COMPACT_WG_X}u;
    let i = flatWG * 256u + local_id.x;
    if (i >= total) { return; }

    let rawVal = grid[i];
    let matId = rawVal & 0xFu;

    if (matId != 0u) {
        let gx = u32(u.gridX); let gy = u32(u.gridY); let gz = u32(u.gridZ);
        let x = i % gx; let y = (i / gx) % gy; let z = i / (gx * gy);

        var isVisible = false;

        if (x == 0u || x == gx - 1u || y == 0u || y == gy - 1u || z == 0u || z == gz - 1u) {
            isVisible = true;
        } else {
            let left = grid[i - 1u] & 0xFu;
            let right = grid[i + 1u] & 0xFu;
            let bottom = grid[i - gx] & 0xFu;
            let top = grid[i + gx] & 0xFu;
            let back = grid[i - gx * gy] & 0xFu;
            let front = grid[i + gx * gy] & 0xFu;

            if (matId == 3u || matId == 4u) {
                isVisible = (left == 0u || right == 0u || bottom == 0u || top == 0u || back == 0u || front == 0u);
            } else {
                isVisible = (left == 0u || left == 3u || left == 4u ||
                             right == 0u || right == 3u || right == 4u ||
                             bottom == 0u || bottom == 3u || bottom == 4u ||
                             top == 0u || top == 3u || top == 4u ||
                             back == 0u || back == 3u || back == 4u ||
                             front == 0u || front == 3u || front == 4u);
            }
        }

        if (isVisible) {
            let slot = atomicAdd(&drawArgs[1], 1u);
            visibleList[slot] = i;
            if (slot % 256u == 0u) {
                atomicAdd(&lightDispatch[0], 1u);
            }
        }
    }
}
`;
}
