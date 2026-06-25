'use client';

import { useEffect, useRef, useState } from 'react';

export function CameraCapture({ onCapture, onCancel }: { onCapture: (dataUrl: string) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 2560 },
        },
        audio: false,
      })
      .then((stream) => {
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('ライブカメラを起動できませんでした。スマホ標準カメラ撮影または画像選択を利用してください。'));
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <section className="card">
      <h1>ライブカメラ撮影</h1>
      <p className="lead left">標準カメラのほうがピントが合いやすいため、通常は「カメラで撮影」をおすすめします。</p>
      {error ? <p className="notice">{error}</p> : <video ref={videoRef} className="video" autoPlay playsInline muted />}
      <div className="actions">
        <button className="button" type="button" onClick={capture} disabled={Boolean(error)}>撮影する</button>
        <button className="button ghost" type="button" onClick={onCancel}>戻る</button>
      </div>
    </section>
  );
}
