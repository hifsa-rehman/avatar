import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Create proxy for three/addons imports
const createThreeAddonsProxy = () => {
  return {
    get: function(target, prop) {
      if (prop === 'renderers/CSS3DRenderer.js') {
        return { CSS3DRenderer };
      }
      return undefined;
    }
  };
};

// Patch the module system
const moduleProxy = new Proxy({}, createThreeAddonsProxy());
window.THREE = THREE;
window.__three_addons__ = moduleProxy;

// Override import.meta.resolve for three/addons
const originalResolve = import.meta.resolve;
import.meta.resolve = (id) => {
  if (id.startsWith('three/addons/')) {
    return Promise.resolve(id);
  }
  return originalResolve(id);
};
