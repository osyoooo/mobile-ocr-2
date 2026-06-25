import { createWorker } from 'tesseract.js';
import { normalizeQuantity } from './calc';
import { cropSegmentCells, imageSourceToCanvas } from './imageProcessing';
import type { CaptureSegment, OcrResult, PercentRect } from '@/types';

export async function recognizeSegmentQuantities(
  image: Blob | string,
  cropRect: PercentRect,
  segment: CaptureSegment,
  onProgress?: (message: string) => void,
): Promise<OcrResult> {
  onProgress?.(`${segment.stepLabel} ${segment.title}: 画像を読み込んでいます...`);
  const imageCanvas = await imageSourceToCanvas(image);

  onProgress?.(`${segment.stepLabel} ${segment.title}: 申込冊数欄を分割しています...`);
  const cells = cropSegmentCells(imageCanvas, cropRect, segment.rowCount);
  const cellImages = cells.map((cell) => cell.dataUrl);
  const quantities: number[] = [];
  const rawTexts: string[] = [];
  const confidences: number[] = [];

  if (cells.every((cell) => !cell.hasInk)) {
    return {
      quantities: cells.map(() => 0),
      cellImages,
      rawTexts: cells.map(() => ''),
      confidences: cells.map(() => 0),
    };
  }

  onProgress?.(`${segment.stepLabel} ${segment.title}: OCRエンジンを初期化しています...`);
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status) onProgress?.(`${m.status} ${Math.round((m.progress || 0) * 100)}%`);
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: '8',
    });

    for (let i = 0; i < cells.length; i += 1) {
      const no = segment.startNo + i;

      if (!cells[i].hasInk) {
        onProgress?.(`No${no}: 空欄として処理しました。`);
        quantities.push(0);
        rawTexts.push('');
        confidences.push(0);
        continue;
      }

      onProgress?.(`No${no}を読み取り中...`);
      const { data } = await worker.recognize(cells[i].canvas);
      quantities.push(normalizeQuantity(data.text));
      rawTexts.push(data.text.trim());
      confidences.push(Math.round(data.confidence ?? 0));
    }
  } finally {
    await worker.terminate();
  }

  return { quantities, cellImages, rawTexts, confidences };
}
