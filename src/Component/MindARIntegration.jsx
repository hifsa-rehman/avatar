import React, { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { loadGLTF } from "../libs/loader";
import { getMindARThree, createOptimizedRenderer } from '../libs/mindarLoader';
import { IoClose } from "react-icons/io5";

const MindARIntegration = ({ selectedMask, onClose }) => {
  const containerRef = useRef(null);
  const mindarThreeRef = useRef(null);
  const anchorRef = useRef(null);
  const currentModelRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    let isComponentMounted = true;
    let frameId = null;
    let lastRenderTime = 0;
    const fps = 30; // Limit FPS to reduce duplicate renders
    const frameInterval = 1000 / fps;

    const startAR = async () => {
      try {
        console.log("🚀 Step 1: Starting AR setup...");
        const MindARThree = getMindARThree();
        const mindarThree = new MindARThree({
          container: containerRef.current,
          libPath: '/node_modules/mind-ar/dist/',
          maxTrack: 1,
          filterMinCF: 0.0001,
          filterBeta: 500,
          warmup: true,
          debug: true // Enable debug mode to see face tracking
        });

        console.log("📸 Step 2: Setting up scene...");
        mindarThreeRef.current = mindarThree;
        const { scene, camera } = mindarThreeRef.current;

        // Initialize renderer properly
        const renderer = createOptimizedRenderer(containerRef.current);
        mindarThree.renderer = renderer; // Important: set on mindarThree instance

        console.log("👤 Step 3: Creating face tracking...");
        // Single anchor point for better tracking
        const anchor = mindarThree.addAnchor(151); // Changed from 168 to 151
        anchorRef.current = anchor;

        anchor.onTargetFound = () => {
          console.log("✨ Face Detected! Adding model...");
          if (currentModelRef.current) {
            currentModelRef.current.visible = true;
            const worldPos = new THREE.Vector3();
            currentModelRef.current.getWorldPosition(worldPos);
            console.log("📍 Model position:", worldPos);
          }
          setFaceDetected(true);
        };

        anchor.onTargetLost = () => {
          console.log("❌ Face lost, hiding model");
          if (currentModelRef.current) {
            currentModelRef.current.visible = false;
          }
          setFaceDetected(false);
        };

        // Immediate model loading
        if (selectedMask) {
          console.log("🎭 Step 4: Loading initial mask...");
          await loadAndAddModel(selectedMask, anchor.group);
        }

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        scene.add(ambientLight, directionalLight);

        console.log("🎥 Step 5: Starting AR processing...");
        await mindarThree.start();
        console.log("✅ MindAR processing started");

        // Modified render loop with FPS limiting
        const renderLoop = () => {
          if (!isComponentMounted) return;

          const currentTime = performance.now();
          const elapsed = currentTime - lastRenderTime;

          if (elapsed > frameInterval) {
            if (scene.visible && currentModelRef.current) {
              lastRenderTime = currentTime;
              renderer.render(scene, camera);
            }
          }

          frameId = requestAnimationFrame(renderLoop);
        };

        console.log("🎬 Step 6: Starting optimized render loop");
        renderLoop();

      } catch (error) {
        console.error('❌ AR Error:', error);
        setInitError(error);
      }
    };

    // Helper function for loading models
    const MODEL_TRANSFORMS = {
      scale: [0.65, 0.65, 0.65],     // FIXED: Exact value from main.js (was 0.65)
      position: [0, -0.3, 0.3],
      rotation: [0, -0.3, 0.3]
    };

    const loadAndAddModel = async (mask, group) => {
      try {
        if (currentModelRef.current) {
          group.remove(currentModelRef.current);
        }

        // Load visible model first
        const gltf = await loadGLTF(mask.path);
        const model = gltf.scene;
        
        // Create occluder from the same model
        const occluder = gltf.scene.clone();
        const occluderMaterial = new THREE.MeshBasicMaterial({
          colorWrite: false,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });

        // Apply transforms to both models
        [model, occluder].forEach(obj => {
          obj.scale.set(...MODEL_TRANSFORMS.scale);
          obj.position.set(...MODEL_TRANSFORMS.position);
          obj.rotation.set(...MODEL_TRANSFORMS.rotation);
          
          obj.traverse((node) => {
            if (node.isMesh) {
              // For occluder
              if (obj === occluder) {
                node.material = occluderMaterial;
              }
              // For visible model
              else {
                node.material.side = THREE.DoubleSide;
                node.material.transparent = true;
              }
            }
          });
        });

        // Set render order (occluder must render first)
        occluder.renderOrder = 0;
        model.renderOrder = 1;

        // Add both to group in correct order
        group.add(occluder);
        group.add(model);
        
        // Store reference to visible model
        currentModelRef.current = model;
        
        console.log("Model loaded with transforms:", {
          scale: Array.from(model.scale),
          position: Array.from(model.position),
          rotation: Array.from(model.rotation),
          visible: model.visible
        });

        return model;
      } catch (error) {
        console.error("Error loading 3D model:", error);
        return null;
      }
    };

    // Start AR when camera is ready
    console.log("⏳ Waiting for camera...");
    window.addEventListener('camera-ready', startAR);

    return () => {
      isComponentMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (mindarThreeRef.current) {
        mindarThreeRef.current.renderer?.setAnimationLoop(null);
        mindarThreeRef.current.renderer?.dispose();
        mindarThreeRef.current.stop();
      }
      window.removeEventListener('camera-ready', startAR);
    };
  }, []);

  useEffect(() => {
    if (!anchorRef.current || !selectedMask) return;
    
    console.log("Loading new mask:", selectedMask);
    loadAndAddModel(selectedMask, anchorRef.current.group)
      .then(() => console.log("New mask loaded successfully"))
      .catch(err => console.error("Error loading new mask:", err));
  }, [selectedMask]); // Remove faceDetected dependency

  if (initError) {
    return (
      <div className="ar-error">
        <p>Failed to start AR: {initError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="camera-feed-overlay">
      <div 
        ref={containerRef} 
        className="camera-feed-container"
      />
      <button 
        onClick={onClose}
        className="close-button-video"
      >
        <IoClose size={24} />
      </button>
    </div>
  );
};

export default MindARIntegration;