import React, { useState, useEffect } from "react";
import * as THREE from 'three';
import { loadGLTF } from './loader';

// Example 3D mask components
export const MaskOne = () => (
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshStandardMaterial 
      color="#ff6347"
      transparent={true}
      opacity={0.8}
      side={THREE.DoubleSide}
    />
  </mesh>
);

export const MaskTwo = () => (
  <group position={[0, 0, 0]} scale={[0.3, 0.3, 0.3]}>
    <mesh>
      <torusGeometry args={[0.3, 0.1, 16, 32]} />
      <meshStandardMaterial color="#ffb700" />
    </mesh>
  </group>
);

export const MaskThree = () => (
  <group position={[0, 0, 0]} scale={[0.3, 0.3, 0.3]}>
    <mesh>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
      <meshStandardMaterial color="#00ff88" />
    </mesh>
  </group>
);

// 3D Model Components
export const SkullMask = () => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Loading skull model...");
    loadGLTF("./models/skull.glb")  // Updated path
      .then(gltf => {
        console.log("Lion skull loaded:", gltf);
        const loadedModel = gltf.scene;
        loadedModel.rotation.x = -0.5; // Adjust rotation
        loadedModel.scale.set(0.5, 0.5, 0.5);
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
        loadedModel.rotation.x = -0.5;
        loadedModel.scale.set(0.5, 0.5, 0.5);
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
        loadedModel.rotation.x = -0.5;
        loadedModel.scale.set(0.5, 0.5, 0.5);
        setModel(loadedModel);
      })
      .catch(err => {
        console.error("Error loading venom:", err);
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
  return <primitive object={model} scale={[0.5, 0.5, 0.5]} />;
};

// Masks configuration array
export const masks = [
  { 
    name: "Simple Mask", 
    component: MaskOne
  },
  { 
    name: "Torus Mask", 
    component: MaskTwo
  },
  { 
    name: "Cyber Mask", 
    component: MaskThree
  },
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