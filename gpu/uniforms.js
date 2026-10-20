// ============================================================
// gpu/uniforms.js — Uniform buffer CPU→GPU
// Gère le Float32Array/Uint32Array partagé et l'upload vers le GPU.
// Layout : voir shaders/common/uniforms.wgsl.js
// ============================================================

import { gpu } from './device.js';
import { config } from '../config.js';

const FLOAT_COUNT = config.UNIFORM_BUFFER_SIZE / 4; // 36 slots

/** Buffer WebGPU pour les uniformes */
export let uniformBuffer = null;

/** Vue float32 pour écrire les valeurs f32 */
export const uniformData = new Float32Array(FLOAT_COUNT);

/** Vue uint32 sur le même ArrayBuffer (pour frame u32 à l'index 17) */
export const uniformDataU32 = new Uint32Array(uniformData.buffer);

/** Crée le uniformBuffer sur le device (appeler après initGPU) */
export function createUniformBuffer() {
  uniformBuffer = gpu.device.createBuffer({
    size: config.UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

/** Envoie uniformData vers le GPU */
export function uploadUniforms() {
  gpu.device.queue.writeBuffer(uniformBuffer, 0, uniformData);
}
