import { CELL_CROP, percentRectToPixelRect } from './layout';
import type { PercentRect } from '@/types';

export type CellForOcr = {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  inkRatio: number;
  hasInk: boolean;
};

const MAX_IMAGE_SIDE = 2400;
const MIN_INK_RATIO = 0.0025;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export async function imageSourceToCanvas(source: Blob | string): Promise<HTMLCanvasElement> {
  const image = new Image();
  image.decoding = 'async';
  const objectUrl = typeof source === 'string' ? '' : URL.createObjectURL(source);
  image.src = typeof source === 'string' ? source : objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    });

    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvasを初期化できませんでした。');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function cropCanvasByPercent(sourceCanvas: HTMLCanvasElement, cropRect: PercentRect): HTMLCanvasElement {
  const rect = percentRectToPixelRect(cropRect, sourceCanvas.width, sourceCanvas.height);
  const cropped = createCanvas(rect.width, rect.height);
  const ctx = cropped.getContext('2d');
  if (!ctx) return cropped;
  ctx.drawImage(sourceCanvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return cropped;
}

export function cropSegmentCells(sourceCanvas: HTMLCanvasElement, cropRect: PercentRect, rowCount: number): CellForOcr[] {
  const quantityArea = cropCanvasByPercent(sourceCanvas, cropRect);
  const rowHeight = quantityArea.height / rowCount;

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const x = quantityArea.width * CELL_CROP.leftPadding;
    const y = rowHeight * rowIndex + rowHeight * CELL_CROP.topPadding;
    const width = quantityArea.width * (1 - CELL_CROP.leftPadding - CELL_CROP.rightPrintedUnitTrim);
    const height = rowHeight * (1 - CELL_CROP.topPadding - CELL_CROP.bottomPadding);

    const cell = createCanvas(width, height);
    const ctx = cell.getContext('2d');
    if (ctx) {
      ctx.drawImage(quantityArea, x, y, width, height, 0, 0, width, height);
    }

    return preprocessCell(cell);
  });
}

export function preprocessCell(sourceCanvas: HTMLCanvasElement): CellForOcr {
  const scale = 4;
  const enlarged = createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
  const enlargedCtx = enlarged.getContext('2d', { willReadFrequently: true });
  if (!enlargedCtx) {
    const dataUrl = sourceCanvas.toDataURL('image/png');
    return { canvas: sourceCanvas, dataUrl, inkRatio: 0, hasInk: false };
  }

  enlargedCtx.fillStyle = '#fff';
  enlargedCtx.fillRect(0, 0, enlarged.width, enlarged.height);
  enlargedCtx.imageSmoothingEnabled = false;
  enlargedCtx.drawImage(sourceCanvas, 0, 0, enlarged.width, enlarged.height);

  binarize(enlarged, enlargedCtx);
  const bounds = findInkBounds(enlarged, enlargedCtx);
  const inkRatio = bounds.count / (enlarged.width * enlarged.height);
  const hasInk = inkRatio >= MIN_INK_RATIO && bounds.width > 4 && bounds.height > 4;

  if (!hasInk) {
    const blank = createCanvas(180, 120);
    const blankCtx = blank.getContext('2d');
    if (blankCtx) {
      blankCtx.fillStyle = '#fff';
      blankCtx.fillRect(0, 0, blank.width, blank.height);
    }
    return { canvas: blank, dataUrl: blank.toDataURL('image/png'), inkRatio, hasInk: false };
  }

  const padded = padAndCenterInk(enlarged, bounds);
  return { canvas: padded, dataUrl: padded.toDataURL('image/png'), inkRatio, hasInk };
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

function binarize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const histogram = new Array<number>(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[gray] += 1;
  }

  const threshold = Math.min(205, Math.max(110, otsuThreshold(histogram, canvas.width * canvas.height) + 8));

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const value = gray < threshold ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

function otsuThreshold(histogram: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < histogram.length; i += 1) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 160;

  for (let i = 0; i < histogram.length; i += 1) {
    wB += histogram[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;

    if (between > maxVariance) {
      maxVariance = between;
      threshold = i;
    }
  }

  return threshold;
}

function findInkBounds(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] < 128) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        count += 1;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: 0, height: 0, count };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    count,
  };
}

function padAndCenterInk(canvas: HTMLCanvasElement, bounds: { x: number; y: number; width: number; height: number }): HTMLCanvasElement {
  const margin = 28;
  const sourceX = Math.max(0, bounds.x - margin);
  const sourceY = Math.max(0, bounds.y - margin);
  const sourceRight = Math.min(canvas.width, bounds.x + bounds.width + margin);
  const sourceBottom = Math.min(canvas.height, bounds.y + bounds.height + margin);
  const sourceWidth = sourceRight - sourceX;
  const sourceHeight = sourceBottom - sourceY;

  const targetWidth = Math.max(180, Math.min(420, sourceWidth + margin * 2));
  const targetHeight = Math.max(120, Math.min(260, sourceHeight + margin * 2));
  const target = createCanvas(targetWidth, targetHeight);
  const ctx = target.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, target.width, target.height);

  const maxDrawWidth = target.width - margin;
  const maxDrawHeight = target.height - margin;
  const scale = Math.min(maxDrawWidth / sourceWidth, maxDrawHeight / sourceHeight, 1.8);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (target.width - drawWidth) / 2;
  const drawY = (target.height - drawHeight) / 2;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
  return target;
}
