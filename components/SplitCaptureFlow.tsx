'use client';

import { ImageUploader } from './ImageUploader';
import { NativeCameraInput } from './NativeCameraInput';
import type { CaptureSegment } from '@/types';

type SplitCaptureFlowProps = {
  segment: CaptureSegment;
  segmentIndex: number;
  totalSegments: number;
  notice?: string;
  onSelect: (file: File) => void;
  onUseLiveCamera: () => void;
  onCancel: () => void;
};

export function SplitCaptureFlow({ segment, segmentIndex, totalSegments, notice, onSelect, onUseLiveCamera, onCancel }: SplitCaptureFlowProps) {
  return (
    <section className="card">
      <p className="step-pill">撮影 {segmentIndex + 1}/{totalSegments}</p>
      <h1>{segment.title}を撮影</h1>
      <p className="lead left">{segment.description}</p>

      <div className="capture-guide">
        <strong>撮影のコツ</strong>
        <p>表全体ではなく、右端の「申込冊数」列だけを画面いっぱいに入れてください。</p>
        <p>次の画面で枠を合わせるので、多少斜めでも大丈夫です。数字が大きく写ることを優先してください。</p>
      </div>

      {notice ? <p className="notice">{notice}</p> : null}

      <div className="actions">
        <NativeCameraInput onSelect={onSelect} label={`${segment.stepLabel} ${segment.title}をカメラで撮影`} />
        <ImageUploader onSelect={onSelect} label="保存済み画像を選択" />
        <button className="button ghost" type="button" onClick={onUseLiveCamera}>ライブカメラを使う</button>
        <button className="button ghost" type="button" onClick={onCancel}>最初に戻る</button>
      </div>
    </section>
  );
}
