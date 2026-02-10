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
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "user" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) videoRef.current.srcObject = stream;
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
      setSuccess(false); // reset success when taking a new photo
    }, "image/jpeg");
  };

  const upload = async () => {
    if (!photo) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", photo);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) setSuccess(true);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setPhoto(null);
    setSuccess(false);
    startCamera(); // restart camera on retake
  };

  return (
    <div className="p-4 flex flex-col items-center gap-4 min-h-[80vh]">
      {success && (
        <p className="p-4 text-green-600 text-center font-semibold">
          Uploaded successfully ✅
        </p>
      )}

      {/* Show video if no preview */}
      {!preview && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rounded border border-gray-300 max-w-full max-h-[480px]"
        />
      )}

      {/* Show image preview */}
      {preview && (
        <img
          src={preview}
          className="rounded border border-gray-300 max-w-full max-h-[480px]"
        />
      )}

      <div className="flex gap-4 mt-4">
        {!preview && (
          <button
            onClick={takePhoto}
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Take Photo
          </button>
        )}

        {preview && (
          <button
            onClick={handleRetake}
            className="px-6 py-2 rounded-full bg-gray-500 text-white font-semibold hover:bg-gray-600 transition"
          >
            Retake
          </button>
        )}

        {preview && !success && (
          <button
            onClick={upload}
            disabled={loading}
            className={`px-6 py-2 rounded-full text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Uploading..." : "Use Photo"}
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
