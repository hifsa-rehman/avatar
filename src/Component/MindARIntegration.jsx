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
        const anchor = mindarThree.addAnchor(168);
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
    const loadAndAddModel = async (mask, group) => {
      try {
        if (mask.path) {
          const gltf = await loadGLTF(mask.path);
          const model = gltf.scene;
          model.scale.set(0.3, 0.3, 0.3);
          model.position.set(0, 0, 0);
          model.rotation.set(0, Math.PI, 0);
          group.add(model);
          currentModelRef.current = model;
          console.log("✅ 3D Model loaded successfully");
          return model;
        } else {
          const mask = new selectedMask.component();
          mask.scale.set(0.3, 0.3, 0.3);
          group.add(mask);
          currentModelRef.current = mask;
          console.log("✅ Basic mask created successfully");
          return mask;
        }
      } catch (error) {
        console.error("❌ Model loading error:", error);
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

    const loadModel = async () => {
      try {
        if (currentModelRef.current) {
          anchorRef.current.group.remove(currentModelRef.current);
        }

        if (selectedMask.path) {
          const gltf = await loadGLTF(selectedMask.path);
          const model = gltf.scene;
          
          // Adjusted model positioning for better face alignment
          model.scale.set(0.25, 0.25, 0.25); // Slightly smaller scale
          model.position.set(0, -0.1, 0.2); // Moved slightly forward
          model.rotation.set(0, Math.PI, 0);
          
          anchorRef.current.group.add(model);
          currentModelRef.current = model;
          model.visible = faceDetected;
        } else {
          const mask = new selectedMask.component();
          mask.scale.set(0.3, 0.3, 0.3);
          mask.position.set(0, -0.05, 0.2); // Adjusted position
          mask.rotation.set(0, Math.PI, 0);
          anchorRef.current.group.add(mask);
          currentModelRef.current = mask;
          mask.visible = faceDetected;
        }
      } catch (error) {
        console.error("❌ Model loading error:", error);
      }
    };

    loadModel();
  }, [selectedMask, faceDetected]);

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
    <div style={{ position: 'relative' }}>
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          zIndex: 2,
          pointerEvents: 'none'
        }} 
      />
      <button 
        onClick={onClose}
        style={{ 
          position: 'absolute',
          bottom: '10px',  // Adjusted to place below the camera view axis
          left: '50%',     // Center horizontally
          transform: 'translateX(-50%)', // Center alignment
          zIndex: 10,
          background: 'transparent',
          color: 'white',
          border: '1px solid white',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(2px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
        }}
      >
        <IoClose size={24} style={{ color: 'white' }} />
      </button>
    </div>
  );
};

export default MindARIntegration;