export interface ImageCompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxBytes?: number;
  outputType?: 'image/webp' | 'image/jpeg';
}

export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

const DEFAULT_MAX_DIMENSION = 1400;
const DEFAULT_QUALITY = 0.8;
const DEFAULT_MAX_BYTES = 320_000;
const MIN_QUALITY = 0.5;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode image.'));
    image.src = src;
  });
}

function getBase64SizeInBytes(dataUrl: string): number {
  const base64Part = dataUrl.split(',')[1] ?? '';
  const padding = base64Part.endsWith('==') ? 2 : base64Part.endsWith('=') ? 1 : 0;
  return Math.floor((base64Part.length * 3) / 4) - padding;
}

function fitDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    const ratio = maxDimension / width;
    return {
      width: maxDimension,
      height: Math.round(height * ratio),
    };
  }

  const ratio = maxDimension / height;
  return {
    width: Math.round(width * ratio),
    height: maxDimension,
  };
}

function encodeCanvas(canvas: HTMLCanvasElement, type: 'image/webp' | 'image/jpeg', quality: number): string {
  return canvas.toDataURL(type, quality);
}

export async function compressImageFileToDataUrl(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<CompressedImageResult> {
  if (typeof window === 'undefined') {
    throw new Error('Image compression can only run in the browser.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const outputType = options.outputType ?? 'image/webp';

  const fileDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(fileDataUrl);

  let { width, height } = fitDimensions(image.naturalWidth, image.naturalHeight, maxDimension);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to initialize image processing context.');
  }

  let quality = Math.min(1, Math.max(MIN_QUALITY, options.quality ?? DEFAULT_QUALITY));
  let attempts = 0;
  let resultDataUrl = '';

  while (attempts < 8) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    resultDataUrl = encodeCanvas(canvas, outputType, quality);
    const bytes = getBase64SizeInBytes(resultDataUrl);
    if (bytes <= maxBytes || (quality <= MIN_QUALITY && (width <= 900 && height <= 900))) {
      return {
        dataUrl: resultDataUrl,
        width,
        height,
        bytes,
      };
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.08);
    } else {
      const nextWidth = Math.round(width * 0.88);
      const nextHeight = Math.round(height * 0.88);
      if (nextWidth < 320 || nextHeight < 320) {
        return {
          dataUrl: resultDataUrl,
          width,
          height,
          bytes,
        };
      }

      width = nextWidth;
      height = nextHeight;
    }

    attempts += 1;
  }

  const bytes = getBase64SizeInBytes(resultDataUrl);
  return {
    dataUrl: resultDataUrl,
    width,
    height,
    bytes,
  };
}
