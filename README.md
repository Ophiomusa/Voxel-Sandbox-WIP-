Voxel Sandbox (WIP)
An experimental 3D voxel engine where both physics simulation and rendering logic are entirely offloaded to the GPU using WebGPU Compute Shaders.

This project serves as a technical sandbox focused on GPU-driven architectures and WGSL (WebGPU Shading Language) optimization. The main goal is to push real-time performance by letting the GPU handle the heavy lifting entirely on its own.

Key Technical Features
1. Massively Parallel Physics
Real-time cellular automata simulation for fluid dynamics (sand, water, gas), gravity, and object collisions.

What it means: Instead of calculating physics one voxel at a time on the CPU, the engine updates the entire 3D grid simultaneously on the graphics card.

Under the hood: The state of the world is computed entirely using GPU atomic operations (array<atomic<u32>>). This ensures that thousands of parallel compute threads can safely update moving materials (like falling sand or flowing water) at the exact same time without data corruption.

2. VRAM Compaction & Indirect Rendering
A dedicated GPU compute pass (compactMain) filters out occluded voxels and generates autonomous draw commands (drawIndirect).

What it means: Rendering every single voxel in a dense 3D grid would destroy performance. The engine solves this by having the GPU scan itself to figure out which voxels are actually visible (hiding the ones buried inside walls).

Under the hood: Once the visible voxels are isolated, the GPU generates its own draw commands. This keeps the CPU completely out of the rendering loop, preventing the classic CPU-to-GPU communication bottleneck and allowing for massive voxel counts.
