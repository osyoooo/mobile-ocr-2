export type Book = { no: number; name: string; price: number };

export type CaptureSegment = {
  id: string;
  stepLabel: string;
  title: string;
  description: string;
  startNo: number;
  endNo: number;
  rowCount: number;
};

export type PercentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QuantityMap = Record<number, number>;

export type OcrResult = {
  quantities: number[];
  cellImages: string[];
  rawTexts?: string[];
  confidences?: number[];
};

export type AppStep = 'home' | 'splitCapture' | 'liveCamera' | 'crop' | 'ocr' | 'confirm';
