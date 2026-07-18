'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { resizeImage } from '@/lib/hairstyle-recommendation/resize';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/hairstyle-recommendation';

interface PhotoDropzoneProps {
  onFileSelected: (
    file: File,
    dataUrl: string,
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
    objectUrl: string
  ) => void;
}

export default function PhotoDropzone({ onFileSelected }: PhotoDropzoneProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const { addToast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Validate and resize file
  const processFile = React.useCallback(
    async (file: File) => {
      setError(null);

      // Type check
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        const msg = t('upload.errorType');
        setError(msg);
        addToast({ type: 'error', message: msg });
        return;
      }

      // Size check (pre-resize)
      if (file.size > MAX_IMAGE_BYTES) {
        const msg = t('upload.errorSize');
        setError(msg);
        addToast({ type: 'error', message: msg });
        return;
      }

      setIsResizing(true);

      try {
        const result = await resizeImage(file);
        const objectUrl = URL.createObjectURL(file);
        setFileName(file.name);
        setPreview(result.dataUrl);
        onFileSelected(
          file,
          result.dataUrl,
          result.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
          objectUrl
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('error.generic');
        setError(msg);
        addToast({ type: 'error', message: msg });
        setFileName(null);
        setPreview(null);
      } finally {
        setIsResizing(false);
      }
    },
    [t, addToast, onFileSelected]
  );

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) processFile(file);
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Clear
  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Tap to choose
  const handleTapChoose = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!preview && !isResizing ? handleTapChoose : undefined}
        className={`relative rounded-md border-2 border-dashed p-8 text-center transition-all duration-150 ${
          isDragOver
            ? 'border-primary bg-surface-card'
            : preview
              ? 'border-hairline bg-surface-card'
              : 'border-hairline bg-canvas hover:border-primary cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          capture="user"
        />

        {!preview ? (
          <>
            <Upload className="w-8 h-8 text-mute mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-body text-charcoal mb-1">
              {t('upload.dropzone')}
            </p>
            <p className="text-caption-sm text-mute">
              {t('upload.hint')}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTapChoose();
              }}
              disabled={isResizing}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash"
            >
              {isResizing ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  {t('upload.analyzing')}
                </>
              ) : (
                t('upload.choose')
              )}
            </button>
          </>
        ) : (
          <>
            <div className="relative inline-block mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-sm object-cover"
              />
              {isResizing && (
                <div className="absolute inset-0 bg-black/20 rounded-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-on-dark animate-spin" />
                </div>
              )}
            </div>
            <p className="text-body-sm text-charcoal mb-2 truncate">
              {fileName}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              disabled={isResizing}
              className="text-sm text-ink-soft hover:text-ink underline disabled:text-ash"
            >
              {t('upload.remove')}
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-caption-sm text-error">{error}</p>
      )}

      {/* Privacy notice */}
      <div className="flex items-start gap-2 rounded-md bg-surface-soft p-3">
        <ShieldCheck className="w-4 h-4 text-success-deep flex-shrink-0 mt-0.5" />
        <p className="text-caption-sm text-mute">
          {t('upload.privacy')}
        </p>
      </div>
    </div>
  );
}
