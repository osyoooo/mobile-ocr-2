'use client';

import { useState } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { CropQuantityArea } from '@/components/CropQuantityArea';
import { OcrProgress } from '@/components/OcrProgress';
import { QuantityConfirm } from '@/components/QuantityConfirm';
import { SplitCaptureFlow } from '@/components/SplitCaptureFlow';
import { BOOKS } from '@/lib/books';
import { CAPTURE_SEGMENTS } from '@/lib/layout';
import { recognizeSegmentQuantities } from '@/lib/ocr';
import type { AppStep, CaptureSegment, PercentRect } from '@/types';

const emptyQuantities = () => BOOKS.map(() => 0);
const emptyCellImages = () => BOOKS.map(() => '');

export default function Home() {
  const [step, setStep] = useState<AppStep>('home');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState<Blob | string | null>(null);
  const [progress, setProgress] = useState('準備中...');
  const [notice, setNotice] = useState('');
  const [quantities, setQuantities] = useState<number[]>(emptyQuantities);
  const [cellImages, setCellImages] = useState<string[]>(emptyCellImages);

  const activeSegment = CAPTURE_SEGMENTS[segmentIndex] ?? CAPTURE_SEGMENTS[0];

  const startSplitCapture = () => {
    setQuantities(emptyQuantities());
    setCellImages(emptyCellImages());
    setSegmentIndex(0);
    setCurrentImage(null);
    setNotice('');
    setStep('splitCapture');
  };

  const selectSegmentImage = (image: Blob | string) => {
    setCurrentImage(image);
    setNotice('');
    setStep('crop');
  };

  const saveSegmentResult = (segment: CaptureSegment, segmentQuantities: number[], segmentCellImages: string[]) => {
    setQuantities((current) => {
      const next = [...current];
      segmentQuantities.forEach((quantity, offset) => {
        next[segment.startNo - 1 + offset] = quantity;
      });
      return next;
    });

    setCellImages((current) => {
      const next = [...current];
      segmentCellImages.forEach((image, offset) => {
        next[segment.startNo - 1 + offset] = image;
      });
      return next;
    });
  };

  const continueAfterSegment = () => {
    setCurrentImage(null);
    if (segmentIndex + 1 < CAPTURE_SEGMENTS.length) {
      setSegmentIndex((current) => current + 1);
      setStep('splitCapture');
    } else {
      setStep('confirm');
    }
  };

  const runSegmentOcr = async (cropRect: PercentRect) => {
    if (!currentImage) return;

    const segment = activeSegment;
    setStep('ocr');
    setProgress(`${segment.stepLabel} ${segment.title}を読み取り中...`);

    try {
      const result = await recognizeSegmentQuantities(currentImage, cropRect, segment, setProgress);
      saveSegmentResult(segment, result.quantities, result.cellImages);
      setNotice('');
    } catch (error) {
      console.error(error);
      saveSegmentResult(segment, Array(segment.rowCount).fill(0), Array(segment.rowCount).fill(''));
      setNotice(`${segment.title}のOCRに失敗しました。確認画面で冊数を手入力してください。`);
    } finally {
      continueAfterSegment();
    }
  };

  return (
    <main className="page">
      {step === 'home' && (
        <section className="card hero">
          <h1 className="title">書籍申込 合計計算</h1>
          <p className="lead">表全体を一発撮影せず、申込冊数欄を3分割で大きく撮影します。手書きOCRの結果を確認・修正して、総合計のみ表示します。</p>
          <div className="flow-preview">
            <span>No1〜No8</span>
            <span>No9〜No15</span>
            <span>No16〜No22</span>
          </div>
          <div className="actions">
            <button className="button" type="button" onClick={startSplitCapture}>3分割撮影を開始</button>
          </div>
        </section>
      )}

      {step === 'splitCapture' && (
        <SplitCaptureFlow
          segment={activeSegment}
          segmentIndex={segmentIndex}
          totalSegments={CAPTURE_SEGMENTS.length}
          notice={notice}
          onSelect={selectSegmentImage}
          onUseLiveCamera={() => setStep('liveCamera')}
          onCancel={() => setStep('home')}
        />
      )}

      {step === 'liveCamera' && <CameraCapture onCapture={selectSegmentImage} onCancel={() => setStep('splitCapture')} />}

      {step === 'crop' && currentImage && (
        <CropQuantityArea image={currentImage} segment={activeSegment} onConfirm={runSegmentOcr} onBack={() => setStep('splitCapture')} />
      )}

      {step === 'ocr' && <OcrProgress message={progress} />}

      {step === 'confirm' && <QuantityConfirm initialQuantities={quantities} cellImages={cellImages} onRetry={startSplitCapture} />}
    </main>
  );
}
