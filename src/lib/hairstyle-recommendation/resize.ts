/**
 * Client-side image resize helper for hairstyle-recommendation.
 * Downscales longest edge ≤ MAX_EDGE_PX, JPEG quality JPEG_QUALITY.
 * Returns data URL + mimeType for upload.
 */

import React from 'react';
import { MAX_EDGE_PX, JPEG_QUALITY } from './constants';

export interface ResizeResult {
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  originalSize: number;
  resizedSize: number;
}

/**
 * Compute new dimensions maintaining aspect ratio.
 * Longest edge ≤ MAX_EDGE_PX; shortest scales proportionally.
 */
export function computeResizedDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  const maxDim = Math.max(originalWidth, originalHeight);
  if (maxDim <= MAX_EDGE_PX) {
    return { width: originalWidth, height: originalHeight };
  }

  const scale = MAX_EDGE_PX / maxDim;
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}

/**
 * Resize image via Canvas API (fallback for OffscreenCanvas).
 * Returns PNG blob.
 */
async function resizeViaCanvas(
  blob: Blob,
  newWidth: number,
  newHeight: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas.toBlob failed'));
        else resolve(blob);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * Resize image via OffscreenCanvas (if available).
 * Modern browsers support this; falls back to Canvas.
 */
async function resizeViaOffscreenCanvas(
  blob: Blob,
  newWidth: number,
  newHeight: number
): Promise<Blob> {
  if (typeof OffscreenCanvas === 'undefined') {
    return resizeViaCanvas(blob, newWidth, newHeight);
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get OffscreenCanvas context');

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  return canvas.convertToBlob({
    type: 'image/jpeg',
    quality: JPEG_QUALITY,
  });
}

/**
 * Main resize function: file → downscaled JPEG.
 * Returns data URL and metadata for API upload.
 *
 * @throws Error if resize fails (invalid image, etc.)
 */
export async function resizeImage(file: File): Promise<ResizeResult> {
  // Validate input
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type');
  }

  const originalSize = file.size;

  // Load image to get dimensions
  const bitmap = await createImageBitmap(file);
  const { width, height } = computeResizedDimensions(
    bitmap.width,
    bitmap.height
  );
  bitmap.close();

  // No resize needed
  if (width === bitmap.width && height === bitmap.height) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          dataUrl,
          mimeType: 'image/jpeg',
          originalSize,
          resizedSize: originalSize,
        });
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  }

  // Resize to JPEG
  const resizedBlob = await resizeViaOffscreenCanvas(file, width, height);
  const resizedSize = resizedBlob.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve({
        dataUrl,
        mimeType: 'image/jpeg',
        originalSize,
        resizedSize,
      });
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(resizedBlob);
  });
}

/**
 * Hook: useResizeImage
 * Manages image file selection, validation, resize, and preview.
 */
export function useResizeImage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectFile = React.useCallback(async (selectedFile: File) => {
    setError(null);
    setIsResizing(true);

    try {
      const result = await resizeImage(selectedFile);
      setFile(selectedFile);
      setPreview(result.dataUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to process image';
      setError(message);
      setFile(null);
      setPreview(null);
    } finally {
      setIsResizing(false);
    }
  }, []);

  const clearFile = React.useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    file,
    preview,
    isResizing,
    error,
    selectFile,
    clearFile,
  };
}
