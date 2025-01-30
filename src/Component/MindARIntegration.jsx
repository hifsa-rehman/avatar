import React, { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { loadGLTF } from "../libs/loader";
import { getMindARThree, createOptimizedRenderer } from '../libs/mindarLoader';
import { IoClose } from "react-icons/io5";

const MindARIntegration = ({ selectedMask, onClose, showControls }) => {
  const containerRef = useRef(null);
  const mindarThreeRef = useRef(null);
  const anchorRef = useRef(null);
  const currentModelRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelScale, setModelScale] = useState(0.65);
  const [modelPosition, setModelPosition] = useState({ x: 0, y: -0.3, z: 0.3 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });

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
      position: [modelPosition.x, modelPosition.y, modelPosition.z],
      rotation: [modelRotation.x, modelRotation.y, modelRotation.z]
    };

    const loadAndAddModel = async (mask, group) => {
      try {
        if (currentModelRef.current) {
          group.remove(currentModelRef.current);
        }

        // Load parameters first
        const params = await loadSavedParameters();
        console.log('Loaded parameters before model:', params);

        if (params) {
          // Update state synchronously
          await new Promise(resolve => {
            setModelScale(params.scale);
            setModelPosition(params.position);
            setModelRotation(params.rotation);
            // Give React time to update state
            requestAnimationFrame(resolve);
          });
        }

        // Load the model
        const gltf = await loadGLTF(mask.path);
        const model = gltf.scene;
        const occluder = gltf.scene.clone();

        // Create material for occluder
        const occluderMaterial = new THREE.MeshBasicMaterial({
          colorWrite: false,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });

        // Apply transforms directly from params if available, otherwise use current state
        const transforms = params || {
          scale: modelScale,
          position: modelPosition,
          rotation: modelRotation
        };

        console.log('Applying transforms:', transforms);

        // Apply transforms to both models
        [model, occluder].forEach(obj => {
          obj.scale.set(transforms.scale, transforms.scale, transforms.scale);
          obj.position.set(
            transforms.position.x,
            transforms.position.y,
            transforms.position.z
          );
          obj.rotation.set(
            transforms.rotation.x,
            transforms.rotation.y,
            transforms.rotation.z
          );
          
          obj.traverse((node) => {
            if (node.isMesh) {
              node.material = obj === occluder ? occluderMaterial : node.material;
              if (obj !== occluder) {
                node.material.side = THREE.DoubleSide;
                node.material.transparent = true;
              }
            }
          });
        });

        // Set render order
        occluder.renderOrder = 0;
        model.renderOrder = 1;

        // Add to scene
        group.add(occluder);
        group.add(model);
        currentModelRef.current = model;

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

  // Modify the useEffect for selectedMask changes
  useEffect(() => {
    if (!anchorRef.current || !selectedMask) return;
    
    const loadMaskWithParameters = async () => {
      try {
        // Load parameters first
        await loadSavedParameters();
        
        // Short delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then load the model
        console.log("Loading mask with updated parameters:", {
          scale: modelScale,
          position: modelPosition,
          rotation: modelRotation
        });
        
        await loadAndAddModel(selectedMask, anchorRef.current.group);
      } catch (err) {
        console.error("Error loading mask with parameters:", err);
      }
    };

    loadMaskWithParameters();
  }, [selectedMask]);

  // Modify loadSavedParameters to return a promise
  const loadSavedParameters = async () => {
    if (!selectedMask) return null;
    
    try {
      const modelName = selectedMask.name.toLowerCase();
      const modelSpecificFile = `/parameters/parameters-${modelName}.json`;
      
      console.log('Loading parameters from:', modelSpecificFile);
      
      const response = await fetch(modelSpecificFile);
      if (!response.ok) {
        throw new Error('Failed to load parameters');
      }
      
      const params = await response.json();
      console.log('Retrieved parameters:', params);

      // Return parameters without setting state
      return params;
    } catch (error) {
      console.error('Error loading parameters:', error);
      return null;
    }
  };

  const saveParameters = async () => {
    if (!selectedMask) return;
  
    const parameters = {
      modelName: selectedMask.name,
      modelPath: selectedMask.path,
      scale: modelScale,
      position: modelPosition,
      rotation: modelRotation
    };
  
    try {
      const response = await fetch('/saveParameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `parameters-${selectedMask.name.toLowerCase()}.json`,
          data: parameters
        })
      });
  
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
      } else {
        throw new Error('Failed to save parameters');
      }
    } catch (error) {
      console.error('Error saving parameters:', error);
      alert('Failed to save parameters. Please try again.');
    }
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
      {showControls && (
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
      )}
      <button onClick={onClose} className="close-button-video">
        <IoClose size={24} />
      </button>
    </div>
  );
};

export default MindARIntegration;