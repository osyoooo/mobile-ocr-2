import type { CaptureSegment, PercentRect } from '@/types';

export const CAPTURE_SEGMENTS: CaptureSegment[] = [
  {
    id: 'segment-1',
    stepLabel: '1/3',
    title: 'No1〜No8',
    description: '上段のNo1〜No8の申込冊数欄だけを大きく撮影してください。',
    startNo: 1,
    endNo: 8,
    rowCount: 8,
  },
  {
    id: 'segment-2',
    stepLabel: '2/3',
    title: 'No9〜No15',
    description: '中段のNo9〜No15の申込冊数欄だけを大きく撮影してください。',
    startNo: 9,
    endNo: 15,
    rowCount: 7,
  },
  {
    id: 'segment-3',
    stepLabel: '3/3',
    title: 'No16〜No22',
    description: '下段のNo16〜No22の申込冊数欄だけを大きく撮影してください。',
    startNo: 16,
    endNo: 22,
    rowCount: 7,
  },
];

export const DEFAULT_CROP_RECT: PercentRect = {
  x: 6,
  y: 7,
  width: 88,
  height: 86,
};

export const RIGHT_EDGE_PRESET_RECT: PercentRect = {
  x: 58,
  y: 9,
  width: 36,
  height: 82,
};

export const CELL_CROP = {
  leftPadding: 0.08,
  rightPrintedUnitTrim: 0.3,
  topPadding: 0.14,
  bottomPadding: 0.14,
} as const;

export const MIN_CROP_SIZE = 8;

export function clampCropRect(rect: PercentRect): PercentRect {
  const width = clamp(rect.width, MIN_CROP_SIZE, 100);
  const height = clamp(rect.height, MIN_CROP_SIZE, 100);
  return {
    x: clamp(rect.x, 0, 100 - width),
    y: clamp(rect.y, 0, 100 - height),
    width,
    height,
  };
}

export function percentRectToPixelRect(rect: PercentRect, imageWidth: number, imageHeight: number) {
  const safeRect = clampCropRect(rect);
  return {
    x: Math.round((safeRect.x / 100) * imageWidth),
    y: Math.round((safeRect.y / 100) * imageHeight),
    width: Math.round((safeRect.width / 100) * imageWidth),
    height: Math.round((safeRect.height / 100) * imageHeight),
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
