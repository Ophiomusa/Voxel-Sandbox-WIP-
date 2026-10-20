// ============================================================
// gpu/device.js — Initialisation WebGPU
// Singleton `gpu` : device, adapter, context, format.
// Appeler initGPU(canvas) une seule fois au démarrage.
// ============================================================

import { config } from '../config.js';

/** Singleton GPU — populé par initGPU() */
export const gpu = {
  device: null,
  adapter: null,
  context: null,
  presentationFormat: null,
};

/**
 * Initialise WebGPU et peuple le singleton `gpu`.
 * @param {HTMLCanvasElement} canvas
 * @throws si WebGPU n'est pas supporté
 */
export async function initGPU(canvas) {
  if (!navigator.gpu) throw new Error('WebGPU non supporté dans ce navigateur.');

  gpu.adapter = await navigator.gpu.requestAdapter();
  if (!gpu.adapter) throw new Error('Aucun adaptateur WebGPU disponible.');

  const requiredLimits = {
    maxStorageBufferBindingSize: gpu.adapter.limits.maxStorageBufferBindingSize,
    maxBufferSize: gpu.adapter.limits.maxBufferSize,
  };

  gpu.device = await gpu.adapter.requestDevice({ requiredLimits });
  gpu.context = canvas.getContext('webgpu');
  gpu.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  gpu.context.configure({
    device: gpu.device,
    format: gpu.presentationFormat,
    alphaMode: 'premultiplied',
  });
}
