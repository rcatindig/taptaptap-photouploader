"use client";

import { useEffect, useRef, useState } from "react";

export default function UploadPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const startCamera = async () => {
    try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const constraints: MediaStreamConstraints = {
        video: isMobile
            ? { facingMode: "user" } // front camera for mobile
            : { width: 640, height: 480 }, // smaller video for web
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
        videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
    }
    };

  useEffect(() => {
    startCamera();
  }, []);

  const takePhoto = () => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    }, "image/jpeg");
  };

  const upload = async () => {
    if (!photo) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", photo);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return <p className="p-4 text-green-600">Uploaded successfully ✅</p>;
  }

  return (
    <div className="p-4">
      {!preview && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded mx-auto"
            style={{
                maxWidth: "640px",   // max width for web
                maxHeight: "480px",  // max height
                width: "100%",       // scales down for smaller screens
                height: "auto",      // keeps aspect ratio
            }}
            />
          <button onClick={takePhoto}>Take Photo</button>
        </>
      )}

      {preview && (
        <>
            <img
            src={preview}
            className="rounded mx-auto"
            style={{ maxWidth: "640px", maxHeight: "480px", width: "100%", height: "auto" }}
            />
            <div className="flex gap-2 mt-2 justify-center">
            <button onClick={() => setPreview(null)}>Retake</button>
            <button onClick={upload} disabled={loading}>
                {loading ? "Uploading..." : "Use Photo"}
            </button>
            </div>
        </>
        )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
