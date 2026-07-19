/**
 * Hairstyle Recommendation Flow State Machine
 *
 * Pure, deterministic reducer for the entire UI flow.
 * No React, Next, SDK, or browser API imports (no URL.createObjectURL, etc.).
 * All mutations return new objects (immutability).
 *
 * The state machine tracks:
 * - User entry path (photo vs manual face-shape pick)
 * - Photo management (object URL persists through analysis)
 * - Face analysis results
 * - User attribute preferences
 * - Recommendations and their preview generation state
 * - Error states
 */

import type {
  FaceAnalysis,
  Recommendation,
  Curation,
} from './types';
import type {
  FaceShape,
  Preference,
  Length,
  HairType,
  Occasion,
  Gender,
} from './constants';

/**
 * Photo data stored in state (not directly displayed; UI manages the object URL lifecycle).
 */
export interface Photo {
  objectUrl: string; // Blob URL (created/revoked by UI layer)
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  data: string; // Base64 or data URL for server transmission
}

/**
 * Preview generation state for a single hairstyle.
 */
export interface PreviewState {
  status: 'idle' | 'generating' | 'done' | 'failed';
  imageDataUrl?: string; // PNG data URL (only when status='done')
  failedAt?: number; // Timestamp of failure
}

/**
 * Stage names mapping to the UI flow.
 */
export type FlowStage =
  | 'entry'
  | 'dropzone'
  | 'facepicker'
  | 'analyzing'
  | 'attributes'
  | 'recommending'
  | 'results'
  | 'error';

/**
 * Complete flow state.
 *
 * Rev 2 updates:
 * - preferences.gender: optional gender (auto-set from analysis, manually overridable)
 * - facePreviewEnabled: toggle for face-preserving preview mode (default true with photo)
 */
export interface FlowState {
  stage: FlowStage;
  entryPath: 'photo' | 'manual' | null; // How user entered: upload or pick?
  photo: Photo | null; // Always-visible uploaded photo (persists through analysis)
  analysis: FaceAnalysis | null; // Result from analyzeFace()
  faceShape: FaceShape | null; // Either from analysis or manual pick
  facePreviewEnabled: boolean; // Rev 2: "Preview on my face" toggle (default true when photo exists)
  preferences: {
    preference: Preference;
    gender?: Gender; // Rev 2: optional gender (auto-filled from analysis unless 'unknown', user-overridable)
    length?: Length;
    hairType?: HairType;
    occasion: Occasion;
  };
  recommendations: Recommendation[]; // Final recommendations returned to user
  curation: Curation | null; // Rev 3: optional overall summary + "styles to avoid" (null when absent)
  previews: Record<string, PreviewState>; // hairstyleId → preview status
  previewQueue: string[]; // Queue of hairstyleIds pending preview generation
  generatingCount: number; // Current concurrent generation tasks (0..PREVIEW_CONCURRENCY)
  error: { code: string; message: string } | null; // Error state
}

/**
 * Action types for the reducer.
 * Each action type has a specific payload structure.
 *
 * Rev 2: Added SET_FACE_PREVIEW for toggle control.
 */
export type FlowAction =
  | { type: 'CHOOSE_ENTRY'; payload: 'photo' | 'manual' }
  | { type: 'SET_PHOTO'; payload: Photo }
  | { type: 'CLEAR_PHOTO' }
  | { type: 'START_ANALYZING' } // Transition to analyzing stage during photo analysis
  | { type: 'PHOTO_ANALYZED'; payload: FaceAnalysis }
  | {
      type: 'ANALYZE_FAILED';
      payload: { code: string; message: string };
    }
  | { type: 'PICK_FACE_SHAPE'; payload: FaceShape }
  | {
      type: 'UPDATE_PREFERENCES';
      payload: Partial<FlowState['preferences']>;
    }
  | { type: 'SWITCH_PATH'; payload: 'photo' | 'manual' }
  | { type: 'START_RECOMMENDING' }
  | {
      type: 'RECOMMENDATIONS_READY';
      payload: { recommendations: Recommendation[]; curation?: Curation };
    }
  | {
      type: 'PREVIEW_STARTED';
      payload: string; // hairstyleId
    }
  | {
      type: 'PREVIEW_DONE';
      payload: { id: string; imageDataUrl: string };
    }
  | { type: 'PREVIEW_FAILED'; payload: string } // hairstyleId
  | { type: 'PREVIEWS_DISABLED' } // Drain queue if IMAGE_GEN_DISABLED
  | { type: 'SET_FACE_PREVIEW'; payload: boolean } // Rev 2: toggle face-preview mode
  | {
      type: 'SET_ERROR';
      payload: { code: string; message: string };
    }
  | { type: 'RESET' };

/**
 * Maximum concurrent preview generations.
 * Defined here for clarity; imported from constants in the route.
 */
const PREVIEW_CONCURRENCY = 2;

/**
 * Initial state: entry screen, nothing loaded.
 *
 * Rev 2: facePreviewEnabled defaults to true (will be controlled by UI once photo exists).
 */
export const initialFlowState: FlowState = {
  stage: 'entry',
  entryPath: null,
  photo: null,
  analysis: null,
  faceShape: null,
  facePreviewEnabled: true,
  preferences: { preference: 'neutral', occasion: 'daily' },
  recommendations: [],
  curation: null,
  previews: {},
  previewQueue: [],
  generatingCount: 0,
  error: null,
};

/**
 * Pure reducer: FlowState → FlowAction → new FlowState.
 *
 * Contract:
 * - Every action returns a new state object (never mutates input).
 * - Photo persists through analysis and recommendations phases.
 * - Preferences and faceShape persist across path switches.
 * - previewGeneratingCount never exceeds PREVIEW_CONCURRENCY.
 * - Unknown hairstyleId actions have no effect (return state unchanged).
 */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'CHOOSE_ENTRY':
      return {
        ...state,
        preferences: { ...state.preferences },
        entryPath: action.payload,
        stage: action.payload === 'photo' ? 'dropzone' : 'facepicker',
        error: null,
      };

    case 'SET_PHOTO':
      return {
        ...state,
        preferences: { ...state.preferences },
        photo: action.payload,
      };

    case 'CLEAR_PHOTO':
      return {
        ...state,
        preferences: { ...state.preferences },
        photo: null,
      };

    case 'START_ANALYZING':
      return {
        ...state,
        preferences: { ...state.preferences },
        stage: 'analyzing',
      };

    case 'PHOTO_ANALYZED': {
      const analysis = action.payload;
      // Rev 2: Auto-apply detected gender if male/female (not 'unknown')
      const newPreferences =
        analysis.gender && analysis.gender !== 'unknown'
          ? { ...state.preferences, gender: analysis.gender as Gender }
          : { ...state.preferences };

      return {
        ...state,
        preferences: newPreferences,
        analysis,
        faceShape: analysis.faceShape,
        stage: 'attributes',
      };
    }

    case 'ANALYZE_FAILED':
      return {
        ...state,
        preferences: { ...state.preferences },
        stage: 'dropzone', // Return to upload, not dead-end error; photo preserved for retry
        error: action.payload,
        // photo is preserved
      };

    case 'PICK_FACE_SHAPE':
      return {
        ...state,
        preferences: { ...state.preferences },
        faceShape: action.payload,
        stage: 'attributes',
        error: null,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'SWITCH_PATH': {
      const newPath = action.payload;
      return {
        ...state,
        preferences: { ...state.preferences },
        entryPath: newPath,
        stage: newPath === 'photo' ? 'dropzone' : 'facepicker',
        error: null,
      };
    }

    case 'START_RECOMMENDING':
      return {
        ...state,
        preferences: { ...state.preferences },
        stage: 'recommending',
        error: null,
      };

    case 'RECOMMENDATIONS_READY': {
      // Initialize previews for all recommendations
      const previews: Record<string, PreviewState> = {};
      const queue: string[] = [];

      for (const rec of action.payload.recommendations) {
        previews[rec.hairstyleId] = { status: 'idle' };
        queue.push(rec.hairstyleId);
      }

      return {
        ...state,
        preferences: { ...state.preferences },
        recommendations: action.payload.recommendations,
        curation: action.payload.curation ?? null,
        stage: 'results',
        previews,
        previewQueue: queue,
        generatingCount: 0, // Reset counter on new recommendations
      };
    }

    case 'PREVIEW_STARTED': {
      const hairstyleId = action.payload;

      // Ignore if hairstyleId not in previews (unknown)
      if (!(hairstyleId in state.previews)) {
        return state;
      }

      // Idempotency guard: if already generating, no-op (prevent double-start)
      if (state.previews[hairstyleId].status === 'generating') {
        return state;
      }

      // Only start if we haven't exceeded concurrency
      if (state.generatingCount >= PREVIEW_CONCURRENCY) {
        return state;
      }

      return {
        ...state,
        preferences: { ...state.preferences },
        previews: {
          ...state.previews,
          [hairstyleId]: { status: 'generating' },
        },
        // CRITICAL FIX: dequeue the id to prevent starvation
        previewQueue: state.previewQueue.filter((id) => id !== hairstyleId),
        generatingCount: state.generatingCount + 1,
      };
    }

    case 'PREVIEW_DONE': {
      const { id: hairstyleId, imageDataUrl } = action.payload;

      // Ignore if hairstyleId not in previews (unknown)
      if (!(hairstyleId in state.previews)) {
        return state;
      }

      return {
        ...state,
        preferences: { ...state.preferences },
        previews: {
          ...state.previews,
          [hairstyleId]: {
            status: 'done',
            imageDataUrl,
          },
        },
        generatingCount: Math.max(0, state.generatingCount - 1),
        previewQueue: state.previewQueue.filter((id) => id !== hairstyleId),
      };
    }

    case 'PREVIEW_FAILED': {
      const hairstyleId = action.payload;

      // Ignore if hairstyleId not in previews (unknown)
      if (!(hairstyleId in state.previews)) {
        return state;
      }

      return {
        ...state,
        preferences: { ...state.preferences },
        previews: {
          ...state.previews,
          [hairstyleId]: {
            status: 'failed',
            failedAt: Date.now(),
          },
        },
        generatingCount: Math.max(0, state.generatingCount - 1),
        previewQueue: state.previewQueue.filter((id) => id !== hairstyleId),
      };
    }

    case 'PREVIEWS_DISABLED': {
      // Drain queue, mark idle items as failed
      const updatedPreviews: Record<string, PreviewState> = {};

      for (const [id, previewState] of Object.entries(state.previews)) {
        if (previewState.status === 'idle') {
          updatedPreviews[id] = {
            status: 'failed',
            failedAt: Date.now(),
          };
        } else {
          updatedPreviews[id] = previewState;
        }
      }

      return {
        ...state,
        preferences: { ...state.preferences },
        previews: updatedPreviews,
        previewQueue: [],
        // generatingCount stays as-is (may be > 0 if some are still generating)
      };
    }

    case 'SET_FACE_PREVIEW': {
      // Rev 2: Toggle face-preview mode and invalidate previews if in results stage
      const newEnabled = action.payload;

      if (state.stage !== 'results' || newEnabled === state.facePreviewEnabled) {
        // No-op if not in results, or toggling to current state
        return {
          ...state,
          facePreviewEnabled: newEnabled,
        };
      }

      // In results stage and toggle changed: invalidate previews and requeue
      const invalidatedPreviews: Record<string, PreviewState> = {};
      const newQueue: string[] = [];

      for (const rec of state.recommendations) {
        invalidatedPreviews[rec.hairstyleId] = { status: 'idle' };
        newQueue.push(rec.hairstyleId);
      }

      return {
        ...state,
        facePreviewEnabled: newEnabled,
        previews: invalidatedPreviews,
        previewQueue: newQueue,
        generatingCount: 0,
      };
    }

    case 'SET_ERROR':
      return {
        ...state,
        preferences: { ...state.preferences },
        stage: 'error',
        error: action.payload,
      };

    case 'RESET':
      return { ...initialFlowState };

    default:
      // Exhaustive switch; unknown actions return state unchanged
      return state;
  }
}

/**
 * Selector helper: determine the next hairstyleId to start preview generation for.
 *
 * Returns the first queued ID if:
 * - Queue is not empty
 * - generatingCount < PREVIEW_CONCURRENCY
 * Otherwise returns null.
 *
 * Used by the UI effect to determine when to dispatch PREVIEW_STARTED.
 */
export function selectNextPreviewTarget(state: FlowState): string | null {
  if (
    state.previewQueue.length === 0 ||
    state.generatingCount >= PREVIEW_CONCURRENCY
  ) {
    return null;
  }

  return state.previewQueue[0] || null;
}
