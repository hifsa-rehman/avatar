// SettingsPopup.jsx
import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { IoClose } from "react-icons/io5";
import { masks } from "../libs/masks.jsx";

const SettingsPopup = ({ setSelectedMask, selectedMask, onSave, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);
  const canvasRef = useRef();
  const invalidateRef = useRef(null);

  // Demand-based rendering hook
  const DemandRender = () => {
    const { invalidate } = useThree();
    useEffect(() => {
      invalidateRef.current = invalidate;
      // Trigger one render
      invalidate();
    }, []);
    return null;
  };

  useEffect(() => {
    // Add a small delay to ensure Canvas mounting
    const timer = setTimeout(() => {
      setIsLoading(false);
      // If the canvas is already mounted, force one re-render
      if (invalidateRef.current) invalidateRef.current();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMaskChange = (e) => {
    const maskName = e.target.value;
    const selected = masks.find((mask) => mask.name === maskName);
    setSelectedMask(selected);
    // Manually redraw the scene
    if (invalidateRef.current) invalidateRef.current();
  };

  const handleSave = () => {
    onSave(selectedMask);
    setIsCanvasVisible(false); // Hide the 3D preview after saving
    // Optionally close the popup here if desired
  };

  return (
    <div className="settings-popup">
      <div className="popup-header">
        <h2>Select a Mask</h2>
        <div className="close-button" onClick={onClose}>
          <IoClose />
        </div>
      </div>
      <div className="mask-selector">
        <select onChange={handleMaskChange} value={selectedMask?.name || "Simple Mask"}>
          {masks.map((mask) => (
            <option key={mask.name} value={mask.name}>
              {mask.name}
            </option>
          ))}
        </select>

        <div className="mask-preview" style={{ height: "300px", width: "100%" }}>
          {!isLoading && isCanvasVisible && (
            <Canvas
              ref={canvasRef}
              style={{ background: "#2C2C2C" }}
              camera={{ position: [0, 0, 2], fov: 50 }}
              frameloop="demand" // Only render on demand
            >
              <DemandRender />
              {/* Scene setup */}
              <color attach="background" args={["#2C2C2C"]} />
              <ambientLight intensity={1} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <spotLight position={[0, 5, 10]} angle={0.15} penumbra={1} intensity={1} />
              {selectedMask?.component && <selectedMask.component />}
              <OrbitControls enableZoom enablePan enableRotate minDistance={1} maxDistance={5} />
            </Canvas>
          )}
        </div>
      </div>
      <button className="save-button" onClick={handleSave}>
        Save
      </button>
    </div>
  );
};

export default SettingsPopup;