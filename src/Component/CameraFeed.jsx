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
    <div className="camera-feed-overlay" style={{ overflow: "hidden" }}>
      <div className="camera-feed-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="camera-feed-video"
          style={{ visibility: 'hidden' }}
        />
      </div>
    </div>
  );
};

export default CameraFeed;
