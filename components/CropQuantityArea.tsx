'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CROP_RECT, RIGHT_EDGE_PRESET_RECT, clampCropRect } from '@/lib/layout';
import type { CaptureSegment, PercentRect } from '@/types';

type CropQuantityAreaProps = {
  image: Blob | string;
  segment: CaptureSegment;
  onConfirm: (cropRect: PercentRect) => void;
  onBack: () => void;
};

export function CropQuantityArea({ image, segment, onConfirm, onBack }: CropQuantityAreaProps) {
  const [crop, setCrop] = useState<PercentRect>(DEFAULT_CROP_RECT);

  const imageUrl = useMemo(() => {
    if (typeof image === 'string') return image;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (typeof image !== 'string') URL.revokeObjectURL(imageUrl);
    };
  }, [image, imageUrl]);

  const update = (key: keyof PercentRect, value: number) => {
    setCrop((current) => clampCropRect({ ...current, [key]: value }));
  };

  const applyPreset = (rect: PercentRect) => {
    setCrop(clampCropRect(rect));
  };

  return (
    <section className="card">
      <p className="step-pill">範囲調整 {segment.stepLabel}</p>
      <h1>{segment.title}の申込冊数欄に枠を合わせる</h1>
      <p className="lead left">赤枠の中に、{segment.title}の申込冊数セルだけが上から下まで入るように調整してください。ヘッダーは入れず、今回のNo範囲だけを入れるのがコツです。</p>

      <div className="crop-stage">
        <img className="crop-image" src={imageUrl} alt={`${segment.title}の撮影画像`} />
        <div
          className="crop-rect"
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${crop.width}%`,
            height: `${crop.height}%`,
          }}
        >
          <span>ここを読み取る</span>
        </div>
      </div>

      <div className="preset-grid">
        <button className="button secondary small" type="button" onClick={() => applyPreset(DEFAULT_CROP_RECT)}>数量欄を大きく撮った</button>
        <button className="button secondary small" type="button" onClick={() => applyPreset(RIGHT_EDGE_PRESET_RECT)}>表の右端も写っている</button>
      </div>

      <div className="sliders">
        <RangeControl label="左" value={crop.x} max={100 - crop.width} onChange={(value) => update('x', value)} />
        <RangeControl label="上" value={crop.y} max={100 - crop.height} onChange={(value) => update('y', value)} />
        <RangeControl label="幅" value={crop.width} min={8} max={100 - crop.x} onChange={(value) => update('width', value)} />
        <RangeControl label="高さ" value={crop.height} min={8} max={100 - crop.y} onChange={(value) => update('height', value)} />
      </div>

      <p className="notice">右端の「冊」は内部で少し除外します。数字が赤枠内で大きく写るようにしてください。</p>

      <div className="actions two">
        <button className="button" type="button" onClick={() => onConfirm(crop)}>この範囲で読み取る</button>
        <button className="button ghost" type="button" onClick={onBack}>撮り直す</button>
      </div>
    </section>
  );
}

function RangeControl({ label, value, min = 0, max = 100, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  const safeMax = Math.max(min, Math.round(max));
  const safeValue = Math.min(safeMax, Math.max(min, Math.round(value)));

  return (
    <label className="range-row">
      <span>{label}</span>
      <input type="range" min={min} max={safeMax} value={safeValue} onChange={(event) => onChange(Number(event.target.value))} />
      <output>{safeValue}%</output>
    </label>
  );
}
