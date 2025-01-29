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
export const LionSkullMask = () => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Loading lion skull model...");
    loadGLTF("./models/lion_skull.glb")  // Updated path
      .then(gltf => {
        console.log("Lion skull loaded:", gltf);
        const loadedModel = gltf.scene;
        loadedModel.rotation.x = -0.5; // Adjust rotation
        loadedModel.scale.set(0.5, 0.5, 0.5);
        setModel(loadedModel);
      })
      .catch(err => {
        console.error("Error loading lion skull:", err);
        setError(err);
      });
  }, []);

  if (error) {
    console.error("Error in LionSkullMask:", error);
    return null;
  }
  return <ModelLoader model={model} />;
};

export const SkullMask = () => {
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

export const VenomMask = () => {
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
    name: "Lion Skull",
    component: LionSkullMask,
    path: "./models/lion_skull.glb"
  },
  {
    name: "Skull",
    component: SkullMask,
    path: "./models/skull_downloadable.glb"
  },
  {
    name: "Venom",
    component: VenomMask,
    path: "./models/skull_planes.glb"
  }
];