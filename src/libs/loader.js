import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const loadGLTF = (url) => {
  return new Promise((resolve, reject) => {
    // Ensure path starts from public directory
    const modelPath = url.startsWith('./') ? url.slice(2) : url;
    console.log("Loading model from:", modelPath);
    
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        console.log("✅ Model loaded:", modelPath);
        resolve(gltf);
      },
      (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error("❌ Model loading error:", error);
        reject(error);
      }
    );
  });
};

// Function to load audio files
export const loadAudio = (url) => {
  return new Promise((resolve, reject) => {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load(
      url,
      (buffer) => {
        resolve(buffer);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
};