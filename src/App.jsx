import React, { useState, useEffect } from "react";
import "./App.css";
import logo from "../src/assets/logo.png";
import ParticlesBackground from "./Component/ParticlesBackground";
import SettingsPopup from "./Component/SettingsPopup";
import CameraFeed from "./Component/CameraFeed";
import MindARIntegration from "./Component/MindARIntegration";
import ErrorBoundary from './Component/ErrorBoundary';
import { masks } from "./libs/masks.jsx";
import { initMindAR } from './libs/mindarLoader';

function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMask, setSelectedMask] = useState(masks[0]);
  const [isMindarReady, setIsMindarReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initMindAR();
        console.log("🎯 MindAR initialized");
        
        // Check camera permissions early
        const permissions = await navigator.permissions.query({ name: 'camera' });
        if (permissions.state === 'denied') {
          console.error("❌ Camera permission denied");
          return;
        }
      } catch (error) {
        console.error("❌ Initialization error:", error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    let timeoutId;
    let attempts = 0;
    const maxAttempts = 30;
    const checkInterval = 500;

    const checkMindarReady = () => {
      if (window.mindARReady && window.MINDAR?.FACE?.MindARThree) {
        console.log("✅ MindAR ready for AR");
        setIsMindarReady(true);
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`⏳ Waiting for MindAR... (${attempts}/${maxAttempts})`);
        timeoutId = setTimeout(checkMindarReady, checkInterval);
      } else {
        console.error("❌ MindAR initialization timeout");
      }
    };

    checkMindarReady();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSaveMask = (mask) => {
    setSelectedMask(mask);
    setIsSettingsOpen(false);
  };
  
  const onClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="app">
      {/* Particle Background */}
      <ParticlesBackground />

      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Welcome Title */}
      <h1 className="welcome-title">Welcome to the 3D Skull Avatar</h1>

      {/* Buttons */}
      <div className="button-container">
        <button className="button" onClick={() => setIsCameraOpen(true)}>
          Open Camera
        </button>
        <button className="button" onClick={() => setIsSettingsOpen(true)}>
          Settings
        </button>
      </div>

      {/* Modified Camera Feed and AR Integration */}
      {isCameraOpen && (
        <ErrorBoundary>
          <div className="camera-container" style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ position: 'relative' }}>
              <CameraFeed />
              {isMindarReady && (
                <MindARIntegration 
                  selectedMask={selectedMask} 
                  key={selectedMask.name}
                  onClose={() => {
                    setIsCameraOpen(false);
                    window.dispatchEvent(new Event('ar-cleanup'));
                  }}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Settings Popup */}
      {isSettingsOpen && (
        <SettingsPopup
          selectedMask={selectedMask}
          setSelectedMask={setSelectedMask}
          onSave={handleSaveMask}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default App;