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

Work in progress
https://www.youtube.com/watch?v=lFm6sKG_vB8


Markdown## 🚀 Quick Start

### Prerequisites
* A modern web browser with **WebGPU** support enabled (Chrome, Edge, or Firefox Nightly).
* [Node.js](https://nodejs.org/) installed on your machine.

### Running locally

1. **Clone the repository** (or download and extract the ZIP archive):
   ```bash
   git clone [https://github.com/your-username/voxel-sandbox.git](https://github.com/your-username/voxel-sandbox.git)
   cd voxel-sandbox
Start the local server:Run the following command in your terminal:Bashnode server.js

(Windows users: you can simply double-click the serve.bat or Ouvrir.bat scripts included in the project).   Test the engine:Open your browser and navigate to:👉 http://localhost:3000   

## 🚀 Quick Start

### Prerequisites
* A modern web browser with **WebGPU** support enabled (Chrome, Edge, or Firefox Nightly).
* [Node.js](https://nodejs.org/) installed on your machine.

### Running locally

1. **Clone the repository** (or download and extract the ZIP archive):
   ```bash
   git clone [https://github.com/your-username/voxel-sandbox.git](https://github.com/your-username/voxel-sandbox.git)
   cd voxel-sandbox

Note: This is a "Work in Progress" project. The codebase structure and features are subject to rapid changes as experimentation continues.💡 Final Words & ContributingGiven the experimental nature of this project, this codebase is primarily a research laboratory for WebGPU capabilities. Feel free to explore the shaders, tweak the physics constants, and even break things to see how the GPU reacts!If you are passionate about GPU-driven architecture, Compute Shaders, or WGSL optimization, I'd love to chat. Feedback, optimization ideas, or technical questions are always welcome in the Issues tab.Thank you so much for stopping by and checking out my project! I hope you find it as fun and inspiring to explore as I did building it. Happy coding and have fun with the voxels! 
