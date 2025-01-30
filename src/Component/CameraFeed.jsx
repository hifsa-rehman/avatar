import React, { useEffect, useRef } from "react";

const CameraFeed = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          window.dispatchEvent(new Event('camera-ready'));
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    initCamera();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        left: 0,
        top: 0,
        visibility: 'hidden'
      }}
    />
  );
};

export default CameraFeed;
