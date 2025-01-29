import React, { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";

const CameraFeed = ({ onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log("📸 Initializing camera...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            frameRate: { ideal: 60 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("🎥 Camera feed active, starting AR...");
            window.dispatchEvent(new Event('camera-ready'));
          };
        }
      } catch (err) {
        console.error("❌ Camera error:", err);
      }
    };

    initCamera();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log("📸 Camera feed stopped");
      }
    };
  }, []);

  return (
    <div className="camera-feed-overlay" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      height: '500px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      zIndex: 1,
      border: '2px solid #333'
    }}>
      <div className="camera-feed-container" style={{
        position: 'relative',
        width: '500px',
        height: '500px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            visibility: 'hidden' // Hide the initial video feed
          }}
        />
      </div>
    </div>
  );
};

export default CameraFeed;
