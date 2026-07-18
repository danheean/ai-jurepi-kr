'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type {
  Recommendation,
  RecommendInput,
} from '@/lib/hairstyle-recommendation';
import { FACE_SHAPES } from '@/lib/hairstyle-recommendation';
import {
  flowReducer,
  initialFlowState,
  selectNextPreviewTarget,
  type FlowState,
} from '@/lib/hairstyle-recommendation/flow';

import EntryChooser from './EntryChooser';
import PhotoDropzone from './PhotoDropzone';
import FaceShapePicker from './FaceShapePicker';
import AttributeSelectors from './AttributeSelectors';
import AnalysisCard from './AnalysisCard';
import RecommendationGrid from './RecommendationGrid';
import ResultActions from './ResultActions';
import MyPhotoPanel from './MyPhotoPanel';
import MobilePhotoChip from './MobilePhotoChip';

interface AnalyzingPlaceholder {
  id: string;
}

const SKELETON_CARDS: AnalyzingPlaceholder[] = Array.from({ length: 3 }, (_, i) => ({
  id: `skeleton-${i}`,
}));

export default function HairstyleTool() {
  const t = useTranslations('tools.hairstyle-recommendation');
  const locale = useLocale() as 'ko' | 'en';
  const { addToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [state, dispatch] = React.useReducer(flowReducer, initialFlowState);

  // ObjectURL lifecycle tracking
  const objectUrlRef = useRef<string | null>(null);

  // AbortController map for in-flight preview requests
  const previewAbortMapRef = useRef<Map<string, AbortController>>(
    new Map()
  );

  // Cleanup objectURL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Cleanup all preview requests on unmount
  useEffect(() => {
    const abortMap = previewAbortMapRef.current;
    return () => {
      abortMap.forEach((ctrl) => ctrl.abort());
      abortMap.clear();
    };
  }, []);

  // Clear preview requests when leaving results stage
  useEffect(() => {
    if (state.stage !== 'results') {
      previewAbortMapRef.current.forEach((ctrl) => ctrl.abort());
      previewAbortMapRef.current.clear();
    }
  }, [state.stage]);

  // Handle photo selection
  const handlePhotoSelected = useCallback(
    async (
      file: File,
      dataUrl: string,
      mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
      objectUrl: string
    ) => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = objectUrl;

      dispatch({
        type: 'SET_PHOTO',
        payload: { objectUrl, mimeType, data: dataUrl },
      });

      // Transition to analyzing stage
      dispatch({ type: 'START_ANALYZING' });

      try {
        const response = await fetch('/api/hairstyle/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, mimeType, locale }),
        });

        const envelope = await response.json();

        if (!response.ok || !envelope.ok) {
          throw {
            code: envelope.error?.code || 'INTERNAL',
            message: envelope.error?.message || t('error.generic'),
          };
        }

        const analysis = envelope.data;
        dispatch({ type: 'PHOTO_ANALYZED', payload: analysis });
      } catch (err: any) {
        const code = err.code || 'INTERNAL';
        const message = err.message || t('error.generic');
        dispatch({
          type: 'ANALYZE_FAILED',
          payload: { code, message },
        });
      }
    },
    [t, locale]
  );

  // Handle face shape selection
  const handleFaceShapePicked = useCallback((shape: typeof FACE_SHAPES[number]) => {
    dispatch({ type: 'PICK_FACE_SHAPE', payload: shape });
  }, []);

  // Update preferences
  const handlePreferencesChange = useCallback(
    (updates: Partial<FlowState['preferences']>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updates });
    },
    []
  );

  // Get recommendations
  const handleGetRecommendations = useCallback(async () => {
    if (!state.faceShape) return;

    dispatch({ type: 'START_RECOMMENDING' });

    try {
      const input: RecommendInput = {
        faceShape: state.faceShape,
        gender: state.preferences.gender,
        preference: state.preferences.preference,
        length: state.preferences.length,
        hairType: state.preferences.hairType,
        occasion: state.preferences.occasion,
        locale,
      };

      const response = await fetch('/api/hairstyle/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const envelope = await response.json();

      if (!response.ok || !envelope.ok) {
        throw {
          code: envelope.error?.code || 'INTERNAL',
          message: envelope.error?.message || t('error.generic'),
        };
      }

      const recommendations = envelope.data.recommendations as Recommendation[];
      dispatch({ type: 'RECOMMENDATIONS_READY', payload: recommendations });
    } catch (err: any) {
      const code = err.code || 'INTERNAL';
      const message = err.message || t('error.generic');
      dispatch({
        type: 'SET_ERROR',
        payload: { code, message },
      });
      addToast({ type: 'error', message });
    }
  }, [state.faceShape, state.preferences, locale, t, addToast]);

  // Preview queue effect: auto-generate previews with proper concurrency control
  useEffect(() => {
    if (state.stage !== 'results') return;

    const target = selectNextPreviewTarget(state);
    if (!target) return;

    // Check if already generating to prevent double-start
    if (state.previews[target]?.status === 'generating') return;

    // Dispatch PREVIEW_STARTED to transition state
    dispatch({ type: 'PREVIEW_STARTED', payload: target });
  }, [state]);

  // Separate effect to execute fetch after PREVIEW_STARTED dispatch
  useEffect(() => {
    if (state.stage !== 'results') return;

    // Find hairstyles with 'generating' status but no abort controller yet
    const generatingIds = Object.entries(state.previews)
      .filter(([_, preview]) => preview.status === 'generating')
      .map(([id]) => id);

    for (const hairstyleId of generatingIds) {
      // Skip if already have an abort controller for this request
      if (previewAbortMapRef.current.has(hairstyleId)) continue;

      const abortCtrl = new AbortController();
      previewAbortMapRef.current.set(hairstyleId, abortCtrl);

      const generatePreview = async () => {
        try {
          const previewPayload: any = {
            hairstyleId,
            locale,
          };

          // Include photo and gender for face-preserving previews
          if (state.facePreviewEnabled && state.photo) {
            previewPayload.image = state.photo.data;
            previewPayload.mimeType = state.photo.mimeType;
          }

          // Always include gender when set
          if (state.preferences.gender) {
            previewPayload.gender = state.preferences.gender;
          }

          const response = await fetch('/api/hairstyle/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previewPayload),
            signal: abortCtrl.signal,
          });

          if (response.status === 503) {
            // IMAGE_GEN_DISABLED: fail this in-flight card too, then drain the queue silently
            dispatch({ type: 'PREVIEW_FAILED', payload: hairstyleId });
            dispatch({ type: 'PREVIEWS_DISABLED' });
            previewAbortMapRef.current.delete(hairstyleId);
            return;
          }

          if (!response.ok) {
            // Failure: quiet, move to next
            dispatch({ type: 'PREVIEW_FAILED', payload: hairstyleId });
            previewAbortMapRef.current.delete(hairstyleId);
            return;
          }

          const envelope = await response.json();
          if (!envelope.ok) {
            dispatch({ type: 'PREVIEW_FAILED', payload: hairstyleId });
            previewAbortMapRef.current.delete(hairstyleId);
            return;
          }

          const imageDataUrl = envelope.data.image;
          dispatch({
            type: 'PREVIEW_DONE',
            payload: { id: hairstyleId, imageDataUrl },
          });
          previewAbortMapRef.current.delete(hairstyleId);
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // Request was cancelled, silent
            previewAbortMapRef.current.delete(hairstyleId);
            return;
          }
          dispatch({ type: 'PREVIEW_FAILED', payload: hairstyleId });
          previewAbortMapRef.current.delete(hairstyleId);
        }
      };

      generatePreview();
    }
  }, [state.stage, state.previews, state.facePreviewEnabled, state.photo, state.preferences.gender, locale]);

  // Handlers
  const handleChooseEntry = useCallback((path: 'photo' | 'manual') => {
    dispatch({ type: 'CHOOSE_ENTRY', payload: path });
  }, []);

  const handleSwitchPath = useCallback(() => {
    const newPath = state.entryPath === 'photo' ? 'manual' : 'photo';
    dispatch({ type: 'SWITCH_PATH', payload: newPath });
  }, [state.entryPath]);

  const handleReplace = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    dispatch({ type: 'CLEAR_PHOTO' });
    dispatch({ type: 'SWITCH_PATH', payload: 'photo' });
  }, []);

  const handleRemove = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    dispatch({ type: 'CLEAR_PHOTO' });
  }, []);

  const handleRegenerate = useCallback(() => {
    handleGetRecommendations();
  }, [handleGetRecommendations]);

  const handleReset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    previewAbortMapRef.current.forEach((ctrl) => ctrl.abort());
    previewAbortMapRef.current.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const handleFacePreviewToggle = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_FACE_PREVIEW', payload: enabled });
  }, []);

  // Entry stage
  if (state.stage === 'entry') {
    return <EntryChooser onChoose={handleChooseEntry} />;
  }

  // Photo path dropzone
  if (state.entryPath === 'photo' && state.stage === 'dropzone') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-charcoal">
            {t('entry.photoLabel')}
          </h2>
          <button
            onClick={handleSwitchPath}
            className="text-sm text-mute hover:text-charcoal underline"
          >
            {t('entry.manualLabel')}
          </button>
        </div>
        <PhotoDropzone onFileSelected={handlePhotoSelected} />

        {/* Error banner for analysis failures */}
        {state.error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 space-y-2">
            <p className="text-sm text-red-900">{state.error.message}</p>
            {state.error.code === 'NO_FACE_DETECTED' && (
              <button
                onClick={() => dispatch({ type: 'SWITCH_PATH', payload: 'manual' })}
                className="text-sm text-red-700 hover:text-red-900 underline font-medium"
              >
                {t('analysis.pickManually')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Manual face-shape picker
  if (state.entryPath === 'manual' && state.stage === 'facepicker') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-charcoal">
            {t('face.pickTitle')}
          </h2>
          <button
            onClick={handleSwitchPath}
            className="text-sm text-mute hover:text-charcoal underline"
          >
            {t('entry.photoLabel')}
          </button>
        </div>
        <FaceShapePicker onSelect={handleFaceShapePicked} />
      </div>
    );
  }

  // Main flow: analyzing, attributes, recommending, results, error
  return (
    <div>
      {/* Mobile sticky photo chip — first on mobile, above the workspace grid */}
      {state.photo && (
        <MobilePhotoChip
          photoUrl={state.photo.objectUrl}
          faceShape={state.faceShape || undefined}
          onReplace={handleReplace}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* RAIL: lg:col-span-1, sticky — FIRST in DOM (left on desktop) */}
      <aside className="lg:col-span-1 lg:sticky lg:top-20 self-start space-y-4">
        {/* My Photo Panel (lg only) */}
        {state.photo && (
          <div className="hidden lg:block">
            <MyPhotoPanel
              photoUrl={state.photo.objectUrl}
              onReplace={handleReplace}
              onRemove={handleRemove}
              facePreviewEnabled={state.facePreviewEnabled}
              onFacePreviewToggle={handleFacePreviewToggle}
            />
          </div>
        )}

        {/* Analysis Card (with skeleton during analyzing) */}
        {(state.analysis || state.stage === 'analyzing') && (
          <>
            {state.analysis ? (
              <AnalysisCard analysis={state.analysis} />
            ) : (
              <div className="rounded-md bg-surface-card p-4 space-y-3">
                <div className="h-6 bg-hairline-soft rounded w-3/4" />
                <div className="h-4 bg-hairline-soft rounded w-full" />
                <div className="h-4 bg-hairline-soft rounded w-4/5" />
              </div>
            )}
          </>
        )}

        {/* Attribute Selectors */}
        {(state.stage === 'attributes' ||
          state.stage === 'analyzing' ||
          state.stage === 'recommending') && (
          <div className="space-y-3">
            <AttributeSelectors
              values={state.preferences}
              onChange={handlePreferencesChange}
              disabled={state.stage === 'analyzing' || state.stage === 'recommending'}
              isGenderAutoDetected={
                state.analysis?.gender &&
                state.analysis.gender !== 'unknown' &&
                state.analysis.gender === state.preferences.gender
              }
            />
          </div>
        )}

        {/* Primary CTA */}
        {(state.stage === 'attributes' ||
          state.stage === 'facepicker' ||
          state.stage === 'recommending') && (
          <button
            onClick={handleGetRecommendations}
            disabled={!state.faceShape || state.stage === 'recommending'}
            className="w-full px-4 py-3 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash min-h-[44px]"
          >
            {state.stage === 'recommending' ? t('cta.finding') : t('cta.get')}
          </button>
        )}
      </aside>

      {/* MAIN: lg:col-span-2 */}
      <div className="lg:col-span-2 space-y-6">
        {/* Analyzing state placeholder */}
        {state.stage === 'analyzing' && (
          <div className="rounded-md bg-surface-card p-6 text-center">
            <div
              className={`inline-block w-8 h-8 rounded-full border-4 border-surface-soft border-t-primary ${
                prefersReducedMotion ? '' : 'animate-spin'
              }`}
              aria-busy="true"
            />
            <p className="mt-3 text-sm text-mute sr-only">
              {t('upload.analyzing')}
            </p>
          </div>
        )}

        {/* Attributes/ready state hint */}
        {state.stage === 'attributes' && (
          <div className="rounded-md bg-surface-soft p-6 text-center">
            <p className="text-sm text-charcoal">
              {t('workspace.readyHint')}
            </p>
          </div>
        )}

        {/* Recommendation results */}
        {state.stage === 'results' && (
          <>
            <RecommendationGrid
              recommendations={state.recommendations}
              previews={state.previews}
            />
            <ResultActions
              onRegenerate={handleRegenerate}
              onReset={handleReset}
              faceShape={state.faceShape}
              recommendations={state.recommendations}
            />
          </>
        )}

        {/* Recommending skeleton */}
        {state.stage === 'recommending' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKELETON_CARDS.map(({ id }) => (
              <div
                key={id}
                className={`rounded-md bg-surface-card aspect-[4/5] ${
                  prefersReducedMotion ? '' : 'animate-pulse'
                }`}
              />
            ))}
          </div>
        )}

        {/* Error recovery */}
        {state.error && state.stage === 'error' && (
          <div className="rounded-md bg-surface-card p-6 text-center space-y-4">
            <p className="text-body text-charcoal">{state.error.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleGetRecommendations}
                className="px-4 py-2 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed"
              >
                {t('result.regenerate')}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-secondary-bg text-ink rounded-md font-button-md hover:bg-secondary-pressed"
              >
                {t('result.reset')}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
