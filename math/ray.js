import { vSub, vAdd, vScale, vNorm, vCross } from './vector.js';

export function computeRay(
  cx, cy, cz,
  camZoom, camAngle, camAngleY,
  mouseX, mouseY,
  resX, resY,
  isOrtho,
  camTargetX, camTargetY, camTargetZ
) {
  const center = [camTargetX, camTargetY, camTargetZ];
  const maxDim = Math.max(cx, cy, cz);
  
  // 1. ROTATION INVERSE (View -> World)
  const sYaw = Math.sin(-camAngle), cYaw = Math.cos(-camAngle);
  const sPitch = Math.sin(-camAngleY), cPitch = Math.cos(-camAngleY);
  
  function viewToWorld(v) {
      let y1 = cPitch * v[1] + sPitch * v[2];
      let z1 = -sPitch * v[1] + cPitch * v[2];
      let x1 = v[0];
      
      let rx = cYaw * x1 + sYaw * z1;
      let rz = -sYaw * x1 + cYaw * z1;
      let ry = y1;
      
      return [rx, ry, rz];
  }

  // 2. CALCUL DU RAYON (Dans l'espace de la caméra)
  const aspect = resX / resY;
  let ro_view, rd_view;

  if (isOrtho) {
      const orthoScale = maxDim * camZoom * 0.5;
      const mX = (mouseX - 0.5) * 2.0 * orthoScale * aspect;
      const mY = ((1.0 - mouseY) - 0.5) * 2.0 * orthoScale;
      
      ro_view = [mX, mY, maxDim * 2.0]; 
      rd_view = [0, 0, -1];
  } else {
      ro_view = [0, 0, maxDim * camZoom];
      
      const mX = (mouseX - 0.5) * 2.0 * aspect;
      const mY = ((1.0 - mouseY) - 0.5) * 2.0;
      rd_view = [mX, mY, -1.5]; 
  }

  // 3. TRANSFORMATION EN 3D (World Space)
  let roOffset = viewToWorld(ro_view);
  let ro = [center[0] + roOffset[0], center[1] + roOffset[1], center[2] + roOffset[2]];
  
  let rdOffset = viewToWorld(rd_view);
  let len = Math.sqrt(rdOffset[0]**2 + rdOffset[1]**2 + rdOffset[2]**2);
  let rd = [rdOffset[0] / len, rdOffset[1] / len, rdOffset[2] / len];

  // 4. VECTEUR "FORWARD"
  let wwOffset = viewToWorld([0, 0, -1]);
  let ww = [wwOffset[0], wwOffset[1], wwOffset[2]];

  return { ro, rd, ww };
}
