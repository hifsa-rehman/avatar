import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import { loadGLTF } from './loader';

// Update MODEL_CONFIG to match main.js exactly
const MODEL_CONFIG = {
  scale: [0.25, 0.25, 0.25],     // Reduced scale for preview
  position: [0, 0, 0],           // Centered position
  rotation: [0, Math.PI, 0]      // Correct rotation
};

export const SkullMask = () => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Loading skull model...");
    loadGLTF("./models/skull.glb")  // Updated path
      .then(gltf => {
        console.log("Skull model loaded:", gltf);
        const loadedModel = gltf.scene;

        loadedModel.scale.set(...MODEL_CONFIG.scale);
        loadedModel.position.set(...MODEL_CONFIG.position);
        loadedModel.rotation.set(...MODEL_CONFIG.rotation);

        console.log("Model transforms:", {
          scale: loadedModel.scale,
          position: loadedModel.position,
          rotation: loadedModel.rotation
        });
        
        setModel(loadedModel);
      })
      .catch(err => {
        console.error("Error loading skull:", err);
        setError(err);
      });
  }, []);

  if (error) {
    console.error("Error in SkullMask:", error);
    return null;
  }
  return <ModelLoader model={model} />;
};


export const SkullMaskDownloadable = () => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGLTF("./models/skull_downloadable.glb")  // Updated path
      .then(gltf => {
        const loadedModel = gltf.scene;

        loadedModel.scale.set(...MODEL_CONFIG.scale);
        loadedModel.position.set(...MODEL_CONFIG.position);
        loadedModel.rotation.set(...MODEL_CONFIG.rotation);

        console.log("Model transforms:", {
          scale: loadedModel.scale,
          position: loadedModel.position,
          rotation: loadedModel.rotation
        });
        
        setModel(loadedModel);
      })
      .catch(err => {
        console.error("Error loading skull:", err);
        setError(err);
      });
  }, []);

  if (error) return null;
  return <ModelLoader model={model} />;
};

export const SkullMaskPlanes = () => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGLTF("./models/skull_planes.glb")  // Updated path
      .then(gltf => {
        const loadedModel = gltf.scene;

        loadedModel.scale.set(...MODEL_CONFIG.scale);
        loadedModel.position.set(...MODEL_CONFIG.position);
        loadedModel.rotation.set(...MODEL_CONFIG.rotation);

        console.log("Model transforms:", {
          scale: loadedModel.scale,
          position: loadedModel.position,
          rotation: loadedModel.rotation
        });
        
        setModel(loadedModel);
      })
      .catch(err => {
        console.error("Error loading skull:", err);
        setError(err);
      });
  }, []);

  if (error) return null;
  return <ModelLoader model={model} />;
};

// Add this debug component
const ModelLoader = ({ model }) => {
  const meshRef = useRef();
  
  useEffect(() => {
    if (!model && meshRef.current) {
      // Animate the ring when model is loading
      const animate = () => {
        if (meshRef.current) {
          meshRef.current.rotation.z += 0.05;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [model]);

  if (!model) {
    console.log("Model is not loaded yet - showing loading ring");
    return (
      <>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <mesh ref={meshRef}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </>
    );
  }
  
  console.log("Model loaded successfully:", model);
  
  // Apply consistent transforms from MODEL_CONFIG
  model.scale.set(...MODEL_CONFIG.scale);
  model.position.set(...MODEL_CONFIG.position);
  model.rotation.set(...MODEL_CONFIG.rotation);
  
  return <primitive object={model} />;
};


// Masks configuration array
export const masks = [
  {
    name: "Skull",
    component: SkullMaskDownloadable,
    path: "./models/skull.glb"
  },
  {
    name: "Skull 01",
    component: SkullMask,
    path: "./models/skull_downloadable.glb"
  },
  {
    name: "Skull 02",
    component: SkullMaskPlanes,
    path: "./models/skull_planes.glb"
  }
];
