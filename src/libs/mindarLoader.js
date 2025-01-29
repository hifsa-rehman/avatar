import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const wasmConfig = {
  locateFile: (file) => `/node_modules/mind-ar/dist/${file}`
};

export const createOptimizedRenderer = (container) => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); // Force 1:1 pixel ratio for better performance
  renderer.info.autoReset = true; // Auto cleanup
  renderer.autoClear = true; // Clear buffer automatically
  
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  
  return renderer;
};

// Initialize MindAR with WASM configuration
export const initMindAR = async () => {
  // Make THREE available globally
  window.THREE = THREE;
  window.CSS3DRenderer = CSS3DRenderer;

  // Import MindAR after globals are set
  const mindARModule = await import('mind-ar/dist/mindar-face.prod.js');
  const { MindARThree } = await import('mind-ar/dist/mindar-face-three.prod.js');

  // Configure WASM and TensorFlow
  window.MINDAR = {
    FACE: {
      MindARThree,
      wasmConfig
    }
  };

  window.mindARReady = true;
  console.log("✅ MindAR and TensorFlow initialized");
};

export const getMindARThree = () => window.MINDAR.FACE.MindARThree;
