import React, { useState, useEffect } from "react";
import * as THREE from 'three';
import { loadGLTF } from './loader';

// Update MODEL_CONFIG to match main.js exactly
const MODEL_CONFIG = {
  scale: [0.65, 0.65, 0.65],    // Match main.js values
  position: [0, -0.3, 0.3],
  rotation: [0, Math.PI, 0]
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
  if (!model) {
    console.log("Model is not loaded yet");
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  console.log("Model loaded successfully:", model);
  
  // Adjust the scale and rotation if needed
  model.scale.set(0.25, 0.25, 0.25); // Increase scale size
  model.rotation.set(0, Math.PI, 0); // Ensure front faces the camera
  model.position.set(0, 0, 0); // Center the model
  
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
