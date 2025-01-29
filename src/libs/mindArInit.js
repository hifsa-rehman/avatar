import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import 'mind-ar/dist/mindar-face.prod.js';
import { MindARThree } from 'mind-ar/dist/mindar-face-three.prod.js';

export const initMindAR = () => {
  // Make THREE and CSS3DRenderer available globally
  window.THREE = THREE;
  window.CSS3DRenderer = CSS3DRenderer;

  // Initialize MindAR
  window.MINDAR = {
    FACE: {
      MindARThree
    }
  };
  window.mindARReady = true;
  window.dispatchEvent(new Event('mindar-face-loaded'));
  console.log('MindAR Face loaded successfully');
};
