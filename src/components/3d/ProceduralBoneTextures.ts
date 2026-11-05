import * as THREE from 'three';

/**
 * Procedural Bone & Cartilage Texture Generator
 * Generates organic cortical bone patterns, osteon lacunae micro-textures,
 * bump maps, and glossy pearlescent hyaline cartilage for realistic 3D anatomy.
 */

// Cached procedural textures to avoid regenerating across renders
let cachedFixedBoneTex: THREE.CanvasTexture | null = null;
let cachedMovingBoneTex: THREE.CanvasTexture | null = null;
let cachedBoneNormalTex: THREE.CanvasTexture | null = null;
let cachedCartilageTex: THREE.CanvasTexture | null = null;

/**
 * Creates high-fidelity cortical bone diffuse texture
 */
export function getBoneDiffuseTexture(isMoving: boolean): THREE.CanvasTexture {
  if (isMoving && cachedMovingBoneTex) return cachedMovingBoneTex;
  if (!isMoving && cachedFixedBoneTex) return cachedFixedBoneTex;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base bone tone: moving bone is lighter ivory, fixed bone has deeper osteoid tone
  const baseColor = isMoving ? '#faf7ee' : '#ded5c2';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle organic striations & Haversian canal lines (longitudinal bone grain)
  ctx.strokeStyle = isMoving ? 'rgba(215, 202, 180, 0.22)' : 'rgba(185, 170, 145, 0.28)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 240; i++) {
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      128, y + (Math.random() - 0.5) * 8,
      384, y + (Math.random() - 0.5) * 8,
      512, y + (Math.random() - 0.5) * 6
    );
    ctx.stroke();
  }

  // Micro-osteon swirls & nutrient foramina pores
  for (let j = 0; j < 500; j++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2.2 + 0.6;
    ctx.fillStyle = isMoving ? 'rgba(195, 180, 160, 0.18)' : 'rgba(165, 150, 130, 0.24)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft warm ambient occlusion / epiphysis gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.02)');
  grad.addColorStop(1, 'rgba(140, 120, 95, 0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  if (isMoving) {
    cachedMovingBoneTex = texture;
  } else {
    cachedFixedBoneTex = texture;
  }
  return texture;
}

/**
 * Creates subtle micro-roughness normal map for osseous surface relief
 */
export function getBoneNormalTexture(): THREE.CanvasTexture {
  if (cachedBoneNormalTex) return cachedBoneNormalTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Neutral normal map base: RGB (128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, 256, 256);

  // Micro-crests and osteon ridges
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, 128 + noise));     // Red (X perturbation)
    data[i + 1] = Math.min(255, Math.max(0, 128 + noise)); // Green (Y perturbation)
    data[i + 2] = 255;                                     // Blue (Z normal up)
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  cachedBoneNormalTex = texture;
  return texture;
}

/**
 * Creates glossy pearlescent hyaline cartilage diffuse texture
 */
export function getCartilageTexture(): THREE.CanvasTexture {
  if (cachedCartilageTex) return cachedCartilageTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Pearlescent porcelain blue-white hyaline base
  ctx.fillStyle = '#eaf4fc';
  ctx.fillRect(0, 0, 256, 256);

  // Soft specular sheen radial gradient
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.20)');
  grad.addColorStop(1, 'rgba(125, 211, 252, 0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedCartilageTex = texture;
  return texture;
}

/**
 * Anatomical PBR Materials
 */
export function createAnatomicalMaterials() {
  const fixedBoneTex = getBoneDiffuseTexture(false);
  const movingBoneTex = getBoneDiffuseTexture(true);
  const boneNormalTex = getBoneNormalTexture();
  const cartilageTex = getCartilageTexture();

  // Fixed Bone Material (Deeper osteoid tone, subtle normal map, realistic bone PBR)
  const fixedBoneMat = new THREE.MeshStandardMaterial({
    map: fixedBoneTex,
    normalMap: boneNormalTex,
    normalScale: new THREE.Vector2(0.35, 0.35),
    color: 0xd6ccb9,
    roughness: 0.52,
    metalness: 0.04,
  });

  // Moving Bone Material (Ivory cortical tone, smoother finish)
  const movingBoneMat = new THREE.MeshStandardMaterial({
    map: movingBoneTex,
    normalMap: boneNormalTex,
    normalScale: new THREE.Vector2(0.28, 0.28),
    color: 0xfdfaf2,
    roughness: 0.42,
    metalness: 0.04,
  });

  // Articular Hyaline Cartilage Material (Pearly porcelain sheen, high smoothness)
  const cartilageMat = new THREE.MeshStandardMaterial({
    map: cartilageTex,
    color: 0xe0f2fe,
    roughness: 0.14,
    metalness: 0.08,
  });

  // X-Ray / Translucent Bone Material for internal joint inspection
  const xRayBoneMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.25,
    metalness: 0.15,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Fibrocartilage Meniscus & Labrum Material
  const fibrocartilageMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.38,
    metalness: 0.08,
  });

  return {
    fixedBoneMat,
    movingBoneMat,
    cartilageMat,
    xRayBoneMat,
    fibrocartilageMat,
  };
}
