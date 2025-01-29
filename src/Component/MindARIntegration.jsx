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
  const [modelScale, setModelScale] = useState(0.65);
  const [modelPosition, setModelPosition] = useState({ x: 0, y: -0.3, z: 0.3 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: Math.PI, z: 0 });

  useEffect(() => {
    loadSavedParameters();
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
      scale: [modelScale, modelScale, modelScale],
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
  }, []); // Remove modelScale dependency

  useEffect(() => {
    if (!anchorRef.current || !selectedMask) return;
    
    console.log("Loading new mask:", selectedMask);
    loadAndAddModel(selectedMask, anchorRef.current.group)
      .then(() => console.log("New mask loaded successfully"))
      .catch(err => console.error("Error loading new mask:", err));
  }, [selectedMask]); // Remove faceDetected dependency

  const loadSavedParameters = async () => {
    try {
      const response = await fetch('/parameters.json');
      if (response.ok) {
        const params = await response.json();
        setModelScale(params.scale || 0.65);
        setModelPosition(params.position || { x: 0, y: -0.3, z: 0.3 });
        setModelRotation(params.rotation || { x: 0, y: Math.PI, z: 0 });
      }
    } catch (error) {
      console.log('No saved parameters found, using defaults');
    }
  };

  const saveParameters = () => {
    const parameters = {
      scale: modelScale,
      position: modelPosition,
      rotation: modelRotation
    };

    // Create a blob with the JSON data
    const blob = new Blob([JSON.stringify(parameters, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parameters.json';
    
    // Append to document, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Parameters saved! Please move the file to the public folder.');
  };

  const updateModelScale = (newScale) => {
    setModelScale(newScale);
    if (currentModelRef.current) {
      const group = currentModelRef.current.parent;
      group.children.forEach(child => {
        if (child.isObject3D) {
          child.scale.set(newScale, newScale, newScale);
        }
      });
    }
  };

  const updateModelPosition = (axis, value) => {
    setModelPosition(prev => {
      const newPosition = { ...prev, [axis]: value };
      if (currentModelRef.current) {
        const group = currentModelRef.current.parent;
        group.children.forEach(child => {
          if (child.isObject3D) {
            child.position[axis] = value;
          }
        });
      }
      return newPosition;
    });
  };

  const updateModelRotation = (axis, value) => {
    setModelRotation(prev => {
      const newRotation = { ...prev, [axis]: value };
      if (currentModelRef.current) {
        const group = currentModelRef.current.parent;
        group.children.forEach(child => {
          if (child.isObject3D) {
            child.rotation[axis] = value;
          }
        });
      }
      return newRotation;
    });
  };

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
      <div ref={containerRef} className="camera-feed-container" />
      <div className="controls-panel">
        <div className="control-column">
          <h3>Scale</h3>
          <div className="control-group">
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={modelScale}
              onChange={(e) => updateModelScale(parseFloat(e.target.value))}
              className="horizontal-slider"
            />
            <span>{modelScale.toFixed(2)}</span>
          </div>
        </div>

        <div className="control-column">
          <h3>Position</h3>
          {['x', 'y', 'z'].map(axis => (
            <div key={`pos-${axis}`} className="control-group">
              <label>{axis.toUpperCase()}</label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={modelPosition[axis]}
                onChange={(e) => updateModelPosition(axis, parseFloat(e.target.value))}
                className="horizontal-slider"
              />
              <span>{modelPosition[axis].toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="control-column">
          <h3>Rotation</h3>
          {['x', 'y', 'z'].map(axis => (
            <div key={`rot-${axis}`} className="control-group">
              <label>{axis.toUpperCase()}</label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={Math.PI / 18}
                value={modelRotation[axis]}
                onChange={(e) => updateModelRotation(axis, parseFloat(e.target.value))}
                className="horizontal-slider"
              />
              <span>{(modelRotation[axis] * 180 / Math.PI).toFixed(0)}°</span>
            </div>
          ))}
        </div>

        <div className="control-column save-column">
          <h3>Save Settings</h3>
          <button 
            className="save-parameters-button"
            onClick={saveParameters}
          >
            Save Parameters
          </button>
        </div>
      </div>
      <button onClick={onClose} className="close-button-video">
        <IoClose size={24} />
      </button>
    </div>
  );
};

export default MindARIntegration;