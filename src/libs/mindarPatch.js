import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Create a fake module for MindAR to import
window.fakeCSSRenderer = CSS3DRenderer;

// Patch the import path
const originalImport = window.import;
window.import = async function(path) {
  if (path === 'three/addons/renderers/CSS3DRenderer.js') {
    return { CSS3DRenderer: window.fakeCSSRenderer };
  }
  return originalImport.apply(this, arguments);
};
