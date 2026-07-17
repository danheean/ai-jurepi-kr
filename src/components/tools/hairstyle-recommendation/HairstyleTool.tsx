'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@/hooks/useToast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type {
  FaceShape,
  Preference,
  Length,
  HairType,
  Occasion,
  FaceAnalysis,
  Recommendation,
  RecommendInput,
} from '@/lib/hairstyle-recommendation';
import { FACE_SHAPES, MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES } from '@/lib/hairstyle-recommendation';

import EntryChooser from './EntryChooser';
import PhotoDropzone from './PhotoDropzone';
import FaceShapePicker from './FaceShapePicker';
import AttributeSelectors from './AttributeSelectors';
import AnalysisCard from './AnalysisCard';
import RecommendationGrid from './RecommendationGrid';
import ResultActions from './ResultActions';

type Stage =
  | 'entry'
  | 'photoUpload'
  | 'faceShapePick'
  | 'attributes'
  | 'analyzing'
  | 'recommending'
  | 'results'
  | 'error';

interface State {
  stage: Stage;
  entryPath: 'photo' | 'manual' | null;
  faceShape: FaceShape | null;
  analysis: FaceAnalysis | null;
  preferences: {
    preference: Preference;
    length?: Length;
    hairType?: HairType;
    occasion: Occasion;
  };
  recommendations: Recommendation[];
  error: {
    code: string;
    message: string;
  } | null;
}

export default function HairstyleTool() {
  const t = useTranslations('tools.hairstyle-recommendation');
  const locale = useLocale() as 'ko' | 'en';
  const { addToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = React.useState<State>({
    stage: 'entry',
    entryPath: null,
    faceShape: null,
    analysis: null,
    preferences: {
      preference: 'neutral',
      occasion: 'daily',
    },
    recommendations: [],
    error: null,
  });

  // Choose photo or manual path
  const handleChooseEntry = (path: 'photo' | 'manual') => {
    setState((prev) => ({
      ...prev,
      entryPath: path,
      stage: path === 'photo' ? 'photoUpload' : 'faceShapePick',
      error: null,
    }));
  };

  // Photo upload + analyze
  const handlePhotoSelected = async (file: File, dataUrl: string, mimeType: string) => {
    setState((prev) => ({
      ...prev,
      stage: 'analyzing',
    }));

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

      const analysis = envelope.data as FaceAnalysis;

      // If confidence < 0.5, prompt manual pick but show analysis
      setState((prev) => ({
        ...prev,
        faceShape: analysis.faceShape,
        analysis,
        stage: analysis.confidence < 0.5 ? 'attributes' : 'attributes',
      }));
    } catch (err: any) {
      const errorCode = err.code || 'INTERNAL';
      const errorMessage = err.message || t('error.generic');

      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: { code: errorCode, message: errorMessage },
      }));

      addToast({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  // Manual face-shape pick
  const handleFaceShapePicked = (shape: FaceShape) => {
    setState((prev) => ({
      ...prev,
      faceShape: shape,
      stage: 'attributes',
    }));
  };

  // Update preferences
  const handlePreferencesChange = (updates: Partial<typeof state.preferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  };

  // Get recommendations
  const handleGetRecommendations = async () => {
    if (!state.faceShape) return;

    setState((prev) => ({
      ...prev,
      stage: 'recommending',
      error: null,
    }));

    try {
      const input: RecommendInput = {
        faceShape: state.faceShape,
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

      setState((prev) => ({
        ...prev,
        recommendations,
        stage: 'results',
      }));

      addToast({
        type: 'success',
        message: t('cta.finding'),
      });
    } catch (err: any) {
      const errorCode = err.code || 'INTERNAL';
      const errorMessage = err.message || t('error.generic');

      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: { code: errorCode, message: errorMessage },
      }));

      addToast({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  // Regenerate recommendations
  const handleRegenerate = async () => {
    await handleGetRecommendations();
  };

  // Reset to entry
  const handleReset = () => {
    setState({
      stage: 'entry',
      entryPath: null,
      faceShape: null,
      analysis: null,
      preferences: {
        preference: 'neutral',
        occasion: 'daily',
      },
      recommendations: [],
      error: null,
    });
  };

  // Switch from photo to manual or vice versa
  const handleSwitchPath = () => {
    const newPath = state.entryPath === 'photo' ? 'manual' : 'photo';
    setState((prev) => ({
      ...prev,
      entryPath: newPath,
      stage: newPath === 'photo' ? 'photoUpload' : 'faceShapePick',
      error: null,
      // Preserve preferences and faceShape
    }));
  };

  // Render stages
  if (state.stage === 'entry') {
    return <EntryChooser onChoose={handleChooseEntry} />;
  }

  if (state.stage === 'photoUpload') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-md font-heading-md text-ink">
            {t('entry.photoLabel')}
          </h2>
          <button
            onClick={() => handleSwitchPath()}
            className="text-sm text-ink-soft hover:text-ink underline"
          >
            {t('entry.manualLabel')}
          </button>
        </div>
        <PhotoDropzone onFileSelected={handlePhotoSelected} />
      </div>
    );
  }

  if (state.stage === 'faceShapePick') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-md font-heading-md text-ink">
            {t('face.pickTitle')}
          </h2>
          <button
            onClick={() => handleSwitchPath()}
            className="text-sm text-ink-soft hover:text-ink underline"
          >
            {t('entry.photoLabel')}
          </button>
        </div>
        <FaceShapePicker onSelect={handleFaceShapePicked} />
      </div>
    );
  }

  if (state.stage === 'attributes' || state.stage === 'analyzing' || state.stage === 'recommending') {
    return (
      <div className="space-y-8">
        {state.analysis && (
          <AnalysisCard analysis={state.analysis} />
        )}

        <AttributeSelectors
          values={state.preferences}
          onChange={handlePreferencesChange}
          disabled={state.stage === 'analyzing' || state.stage === 'recommending'}
        />

        <button
          onClick={handleGetRecommendations}
          disabled={state.stage === 'analyzing' || state.stage === 'recommending'}
          className="w-full px-6 py-3 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash"
        >
          {state.stage === 'recommending' ? t('cta.finding') : t('cta.get')}
        </button>
      </div>
    );
  }

  if (state.stage === 'results') {
    return (
      <div className="space-y-8">
        {state.analysis && (
          <AnalysisCard analysis={state.analysis} />
        )}

        <RecommendationGrid recommendations={state.recommendations} />

        <ResultActions
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          faceShape={state.faceShape}
        />
      </div>
    );
  }

  // Error state
  return (
    <div className="rounded-md bg-surface-card p-6 text-center space-y-4">
      <p className="text-body text-charcoal">{state.error?.message}</p>
      <button
        onClick={handleReset}
        className="px-6 py-2 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed"
      >
        {t('result.reset')}
      </button>
    </div>
  );
}
