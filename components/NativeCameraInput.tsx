'use client';

import { useRef } from 'react';

type NativeCameraInputProps = {
  onSelect: (file: File) => void;
  label?: string;
  variant?: 'primary' | 'secondary';
  capture?: boolean;
};

export function NativeCameraInput({ onSelect, label = 'カメラで撮影', variant = 'primary', capture = true }: NativeCameraInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button className={`button ${variant === 'secondary' ? 'secondary' : ''}`} type="button" onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) onSelect(file);
        }}
      />
    </>
  );
}
