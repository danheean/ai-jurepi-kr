/**
 * Flow State Machine Tests — TDD approach
 *
 * Tests verify the state machine contracts, invariants, and transitions.
 * Pure reducer (no React/Next/SDK imports) — all tests are deterministic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FlowState, FlowAction } from './flow';
import {
  flowReducer,
  initialFlowState,
  selectNextPreviewTarget,
} from './flow';

describe('flowReducer — State Machine', () => {
  let state: FlowState;

  beforeEach(() => {
    state = { ...initialFlowState };
  });

  // ============================================================================
  // ENTRY PATH SELECTION
  // ============================================================================
  describe('CHOOSE_ENTRY', () => {
    it('should transition to dropzone when choosing photo path', () => {
      const action: FlowAction = { type: 'CHOOSE_ENTRY', payload: 'photo' };
      const next = flowReducer(state, action);

      expect(next.entryPath).toBe('photo');
      expect(next.stage).toBe('dropzone');
      expect(next.error).toBeNull();
    });

    it('should transition to facepicker when choosing manual path', () => {
      const action: FlowAction = { type: 'CHOOSE_ENTRY', payload: 'manual' };
      const next = flowReducer(state, action);

      expect(next.entryPath).toBe('manual');
      expect(next.stage).toBe('facepicker');
      expect(next.error).toBeNull();
    });

    it('should return a new object (immutability)', () => {
      const action: FlowAction = { type: 'CHOOSE_ENTRY', payload: 'photo' };
      const next = flowReducer(state, action);

      expect(next).not.toBe(state);
    });
  });

  // ============================================================================
  // PHOTO MANAGEMENT
  // ============================================================================
  describe('SET_PHOTO & CLEAR_PHOTO', () => {
    it('should set photo with all required fields', () => {
      const photo = {
        objectUrl: 'blob:http://localhost/abc123',
        mimeType: 'image/jpeg' as const,
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJ...',
      };
      const action: FlowAction = { type: 'SET_PHOTO', payload: photo };
      const next = flowReducer(state, action);

      expect(next.photo).toEqual(photo);
    });

    it('should clear photo', () => {
      state.photo = {
        objectUrl: 'blob:http://localhost/abc123',
        mimeType: 'image/jpeg',
        data: 'data:image/jpeg;base64,...',
      };
      const action: FlowAction = { type: 'CLEAR_PHOTO' };
      const next = flowReducer(state, action);

      expect(next.photo).toBeNull();
    });

    it('should preserve photo through analyzing stage', () => {
      state.photo = {
        objectUrl: 'blob:http://localhost/abc123',
        mimeType: 'image/jpeg',
        data: 'base64data',
      };
      const originalPhoto = state.photo;

      const analyzeAction: FlowAction = { type: 'START_RECOMMENDING' };
      const next = flowReducer(state, analyzeAction);

      expect(next.photo).toEqual(originalPhoto);
    });
  });

  // ============================================================================
  // FACE ANALYSIS FLOW
  // ============================================================================
  describe('PHOTO_ANALYZED & ANALYZE_FAILED', () => {
    it('should update face analysis and transition to attributes stage', () => {
      const analysis = {
        faceShape: 'oval' as const,
        confidence: 0.92,
        gender: 'male' as const,
        features: ['strong jawline', 'high cheekbones'],
        notes: 'Clear face visibility',
      };
      const action: FlowAction = {
        type: 'PHOTO_ANALYZED',
        payload: analysis,
      };
      const next = flowReducer(state, action);

      expect(next.analysis).toEqual(analysis);
      expect(next.faceShape).toBe('oval');
      expect(next.stage).toBe('attributes');
    });

    it('should handle low confidence face analysis', () => {
      const analysis = {
        faceShape: 'round' as const,
        confidence: 0.45,
        gender: 'female' as const,
        features: ['face partially visible'],
      };
      const action: FlowAction = {
        type: 'PHOTO_ANALYZED',
        payload: analysis,
      };
      const next = flowReducer(state, action);

      expect(next.analysis?.confidence).toBe(0.45); // Stored in analysis
      expect(next.faceShape).toBe('round');
      expect(next.stage).toBe('attributes');
    });

    it('should handle analyze failure and preserve photo for retry', () => {
      state.photo = {
        objectUrl: 'blob:http://localhost/test',
        mimeType: 'image/jpeg',
        data: 'base64data',
      };
      const originalPhoto = state.photo;

      const action: FlowAction = {
        type: 'ANALYZE_FAILED',
        payload: { code: 'NO_FACE_DETECTED', message: 'No face found in image' },
      };
      const next = flowReducer(state, action);

      expect(next.error).toEqual({
        code: 'NO_FACE_DETECTED',
        message: 'No face found in image',
      });
      expect(next.stage).toBe('dropzone'); // Return to upload (not dead-end error)
      expect(next.photo).toEqual(originalPhoto); // Photo stays for retry
    });
  });

  // ============================================================================
  // FACE SHAPE & PREFERENCES
  // ============================================================================
  describe('PICK_FACE_SHAPE', () => {
    it('should set face shape and transition to attributes', () => {
      const action: FlowAction = {
        type: 'PICK_FACE_SHAPE',
        payload: 'square',
      };
      const next = flowReducer(state, action);

      expect(next.faceShape).toBe('square');
      expect(next.stage).toBe('attributes');
    });
  });

  describe('UPDATE_PREFERENCES', () => {
    it('should merge preference updates', () => {
      state.preferences = {
        preference: 'neutral',
        occasion: 'daily',
      };
      const action: FlowAction = {
        type: 'UPDATE_PREFERENCES',
        payload: {
          preference: 'feminine',
          length: 'medium',
        },
      };
      const next = flowReducer(state, action);

      expect(next.preferences.preference).toBe('feminine');
      expect(next.preferences.length).toBe('medium');
      expect(next.preferences.occasion).toBe('daily'); // Preserved
    });

    it('should preserve preferences through stages', () => {
      state.preferences = {
        preference: 'masculine',
        length: 'short',
        hairType: 'curly',
        occasion: 'business',
      };
      state.faceShape = 'round';

      const recommendations = [
        {
          hairstyleId: 'style-1',
          name: { ko: '스타일1', en: 'Style 1' },
          reason: '어울립니다',
          tips: ['팁1'],
          referenceImage: { src: '/img.webp', alt: 'alt', credit: 'credit' },
          tags: [],
        },
      ];
      const action: FlowAction = {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recommendations },
      };
      const next = flowReducer(state, action);

      expect(next.preferences).toEqual(state.preferences);
    });
  });

  // ============================================================================
  // PATH SWITCHING
  // ============================================================================
  describe('SWITCH_PATH', () => {
    it('should switch from photo to manual and preserve preferences', () => {
      state.entryPath = 'photo';
      state.stage = 'attributes';
      state.preferences = {
        preference: 'feminine',
        length: 'medium',
        occasion: 'event',
      };
      state.faceShape = 'oval';

      const action: FlowAction = {
        type: 'SWITCH_PATH',
        payload: 'manual',
      };
      const next = flowReducer(state, action);

      expect(next.entryPath).toBe('manual');
      expect(next.stage).toBe('facepicker');
      expect(next.preferences).toEqual(state.preferences);
      expect(next.faceShape).toBe('oval'); // Preserved
      expect(next.error).toBeNull();
    });

    it('should switch from manual to photo and preserve faceShape', () => {
      state.entryPath = 'manual';
      state.stage = 'facepicker';
      state.faceShape = 'heart';

      const action: FlowAction = {
        type: 'SWITCH_PATH',
        payload: 'photo',
      };
      const next = flowReducer(state, action);

      expect(next.entryPath).toBe('photo');
      expect(next.stage).toBe('dropzone');
      expect(next.faceShape).toBe('heart');
    });
  });

  // ============================================================================
  // RECOMMENDATION FLOW
  // ============================================================================
  describe('START_RECOMMENDING & RECOMMENDATIONS_READY', () => {
    it('should transition to recommending stage', () => {
      const action: FlowAction = { type: 'START_RECOMMENDING' };
      const next = flowReducer(state, action);

      expect(next.stage).toBe('recommending');
      expect(next.error).toBeNull();
    });

    it('should initialize previews and queue on RECOMMENDATIONS_READY', () => {
      const recommendations = [
        {
          hairstyleId: 'bob-short',
          name: { ko: '숏 밥', en: 'Short Bob' },
          reason: 'Perfect for your face shape',
          tips: ['Wash and go', 'Use volumizer'],
          referenceImage: {
            src: '/hairstyles/bob-short/feminine.webp',
            alt: 'Short Bob',
            credit: 'Studio X',
          },
          tags: ['short', 'volume'],
        },
        {
          hairstyleId: 'lob-wavy',
          name: { ko: '롱 롭', en: 'Wavy Lob' },
          reason: 'Adds softness',
          tips: ['Blow dry for texture'],
          referenceImage: {
            src: '/hairstyles/lob-wavy/feminine.webp',
            alt: 'Wavy Lob',
            credit: 'Studio Y',
          },
          tags: ['medium', 'wavy'],
        },
      ];

      const action: FlowAction = {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recommendations },
      };
      const next = flowReducer(state, action);

      expect(next.stage).toBe('results');
      expect(next.recommendations).toHaveLength(2);
      expect(Object.keys(next.previews)).toHaveLength(2);
      expect(next.previews['bob-short']).toEqual({ status: 'idle' });
      expect(next.previews['lob-wavy']).toEqual({ status: 'idle' });
      expect(next.previewQueue).toEqual(['bob-short', 'lob-wavy']);
    });

    it('should reinitialize previews on second RECOMMENDATIONS_READY call (regenerate)', () => {
      // First set of recommendations
      const first = [
        {
          hairstyleId: 'style-1',
          name: { ko: '스타일1', en: 'Style 1' },
          reason: '이유1',
          tips: ['팁1'],
          referenceImage: {
            src: '/img1.webp',
            alt: 'alt1',
            credit: 'credit1',
          },
          tags: [],
        },
      ];
      const action1: FlowAction = {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: first },
      };
      let next = flowReducer(state, action1);
      expect(Object.keys(next.previews)).toHaveLength(1);

      // Regenerate: different recommendations
      const second = [
        {
          hairstyleId: 'style-2',
          name: { ko: '스타일2', en: 'Style 2' },
          reason: '이유2',
          tips: ['팁2'],
          referenceImage: {
            src: '/img2.webp',
            alt: 'alt2',
            credit: 'credit2',
          },
          tags: [],
        },
        {
          hairstyleId: 'style-3',
          name: { ko: '스타일3', en: 'Style 3' },
          reason: '이유3',
          tips: ['팁3'],
          referenceImage: {
            src: '/img3.webp',
            alt: 'alt3',
            credit: 'credit3',
          },
          tags: [],
        },
      ];
      const action2: FlowAction = {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: second },
      };
      next = flowReducer(next, action2);

      expect(Object.keys(next.previews)).toHaveLength(2);
      expect(next.previews['style-2']).toBeDefined();
      expect(next.previews['style-3']).toBeDefined();
      expect(next.previews['style-1']).toBeUndefined(); // Old style removed
      expect(next.previewQueue).toEqual(['style-2', 'style-3']);
    });
  });

  // ============================================================================
  // PREVIEW GENERATION STATE MACHINE
  // ============================================================================
  describe('PREVIEW_STARTED, PREVIEW_DONE, PREVIEW_FAILED', () => {
    beforeEach(() => {
      // Setup: ready state with recommendations
      const recs = [
        {
          hairstyleId: 'style-1',
          name: { ko: '1', en: '1' },
          reason: 'r1',
          tips: ['t1'],
          referenceImage: {
            src: '/1.webp',
            alt: 'a1',
            credit: 'c1',
          },
          tags: [],
        },
        {
          hairstyleId: 'style-2',
          name: { ko: '2', en: '2' },
          reason: 'r2',
          tips: ['t2'],
          referenceImage: {
            src: '/2.webp',
            alt: 'a2',
            credit: 'c2',
          },
          tags: [],
        },
        {
          hairstyleId: 'style-3',
          name: { ko: '3', en: '3' },
          reason: 'r3',
          tips: ['t3'],
          referenceImage: {
            src: '/3.webp',
            alt: 'a3',
            credit: 'c3',
          },
          tags: [],
        },
      ];
      state = flowReducer(state, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recs },
      });
    });

    it('should increment generatingCount on PREVIEW_STARTED up to PREVIEW_CONCURRENCY', () => {
      const PREVIEW_CONCURRENCY = 2;

      // Start first preview
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'style-1',
      });
      expect(next.generatingCount).toBe(1);
      expect(next.previews['style-1'].status).toBe('generating');

      // Start second preview
      next = flowReducer(next, {
        type: 'PREVIEW_STARTED',
        payload: 'style-2',
      });
      expect(next.generatingCount).toBe(2);
      expect(next.previews['style-2'].status).toBe('generating');

      // Third should not be started automatically by reducer
      // (but the UI should check generatingCount before dispatching PREVIEW_STARTED)
    });

    it('should decrement generatingCount on PREVIEW_DONE and remove from queue', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'style-1',
      });
      expect(next.generatingCount).toBe(1);

      next = flowReducer(next, {
        type: 'PREVIEW_DONE',
        payload: { id: 'style-1', imageDataUrl: 'data:image/png;base64,...' },
      });

      expect(next.generatingCount).toBe(0);
      expect(next.previews['style-1']).toEqual({
        status: 'done',
        imageDataUrl: 'data:image/png;base64,...',
      });
      expect(next.previewQueue).not.toContain('style-1');
    });

    it('should handle PREVIEW_FAILED and decrement count', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'style-1',
      });
      expect(next.generatingCount).toBe(1);

      next = flowReducer(next, {
        type: 'PREVIEW_FAILED',
        payload: 'style-1',
      });

      expect(next.generatingCount).toBe(0);
      expect(next.previews['style-1'].status).toBe('failed');
      expect(next.previews['style-1'].failedAt).toBeGreaterThan(0);
      expect(next.previewQueue).not.toContain('style-1');
    });

    it('should clamp generatingCount to 0 on underflow', () => {
      let next = state;
      // Try to decrement without incrementing
      next = flowReducer(next, {
        type: 'PREVIEW_DONE',
        payload: { id: 'style-1', imageDataUrl: 'data:...' },
      });

      expect(next.generatingCount).toBe(0);
    });

    it('should ignore PREVIEW_STARTED for unknown hairstyleId', () => {
      const original = state;
      const next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'unknown-style',
      });

      expect(next).toEqual(original); // State unchanged
    });

    it('should ignore PREVIEW_DONE for unknown hairstyleId', () => {
      const original = state;
      const next = flowReducer(state, {
        type: 'PREVIEW_DONE',
        payload: { id: 'unknown-style', imageDataUrl: 'data:...' },
      });

      expect(next).toEqual(original);
    });
  });

  // ============================================================================
  // PREVIEW QUEUE & DISABLED STATE
  // ============================================================================
  describe('PREVIEWS_DISABLED', () => {
    beforeEach(() => {
      const recs = [
        {
          hairstyleId: 'style-1',
          name: { ko: '1', en: '1' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/1.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
        {
          hairstyleId: 'style-2',
          name: { ko: '2', en: '2' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/2.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
      ];
      state = flowReducer(state, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recs },
      });
    });

    it('should drain queue and clear it on PREVIEWS_DISABLED', () => {
      const action: FlowAction = { type: 'PREVIEWS_DISABLED' };
      const next = flowReducer(state, action);

      expect(next.previewQueue).toHaveLength(0);
    });

    it('should mark idle previews as failed on PREVIEWS_DISABLED', () => {
      const action: FlowAction = { type: 'PREVIEWS_DISABLED' };
      const next = flowReducer(state, action);

      expect(next.previews['style-1'].status).toBe('failed');
      expect(next.previews['style-2'].status).toBe('failed');
    });

    it('should preserve generating/done previews on PREVIEWS_DISABLED', () => {
      let next = state;
      next = flowReducer(next, {
        type: 'PREVIEW_STARTED',
        payload: 'style-1',
      });
      next = flowReducer(next, {
        type: 'PREVIEW_DONE',
        payload: { id: 'style-1', imageDataUrl: 'data:...' },
      });

      const action: FlowAction = { type: 'PREVIEWS_DISABLED' };
      next = flowReducer(next, action);

      expect(next.previews['style-1'].status).toBe('done'); // Preserved
      expect(next.previews['style-2'].status).toBe('failed'); // Marked failed
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  describe('SET_ERROR & error recovery', () => {
    it('should set error and transition to error stage', () => {
      const action: FlowAction = {
        type: 'SET_ERROR',
        payload: {
          code: 'AI_UNAVAILABLE',
          message: 'AI service is temporarily down',
        },
      };
      const next = flowReducer(state, action);

      expect(next.stage).toBe('error');
      expect(next.error).toEqual({
        code: 'AI_UNAVAILABLE',
        message: 'AI service is temporarily down',
      });
    });

    it('should clear error on action that re-engages flow', () => {
      state.error = {
        code: 'NO_FACE_DETECTED',
        message: 'No face found',
      };
      state.stage = 'error';

      const action: FlowAction = {
        type: 'PICK_FACE_SHAPE',
        payload: 'oval',
      };
      const next = flowReducer(state, action);

      expect(next.error).toBeNull();
      expect(next.stage).toBe('attributes');
    });
  });

  // ============================================================================
  // RESET
  // ============================================================================
  describe('RESET', () => {
    it('should restore initial state completely', () => {
      // Pollute state
      state.stage = 'results';
      state.entryPath = 'photo';
      state.faceShape = 'oval';
      state.analysis = {
        faceShape: 'oval',
        confidence: 0.9,
        gender: 'male',
        features: ['jawline'],
      };
      state.preferences = {
        preference: 'feminine',
        length: 'medium',
        occasion: 'business',
      };
      state.recommendations = [
        {
          hairstyleId: 'style-1',
          name: { ko: 'style', en: 'style' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/img.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
      ];
      state.error = { code: 'ERROR', message: 'msg' };
      state.generatingCount = 2;

      const action: FlowAction = { type: 'RESET' };
      const next = flowReducer(state, action);

      expect(next).toEqual(initialFlowState);
    });

    it('should be idempotent', () => {
      state.stage = 'results';
      state.faceShape = 'square';

      const action: FlowAction = { type: 'RESET' };
      const next1 = flowReducer(state, action);
      const next2 = flowReducer(next1, action);

      expect(next1).toEqual(next2);
    });
  });

  // ============================================================================
  // INVARIANTS & IMMUTABILITY
  // ============================================================================
  describe('Invariants', () => {
    it('should never mutate the input state', () => {
      const original = JSON.parse(JSON.stringify(state));
      const action: FlowAction = {
        type: 'CHOOSE_ENTRY',
        payload: 'photo',
      };

      flowReducer(state, action);

      expect(state).toEqual(original);
    });

    it('should return new object on every action', () => {
      const action: FlowAction = { type: 'CHOOSE_ENTRY', payload: 'photo' };
      const next = flowReducer(state, action);

      expect(next).not.toBe(state);
      expect(next.preferences).not.toBe(state.preferences);
    });

    it('should preserve photo through multiple stage transitions', () => {
      state.photo = {
        objectUrl: 'blob:http://localhost/test',
        mimeType: 'image/jpeg',
        data: 'base64data',
      };
      const originalPhoto = state.photo;

      // Photo path: SET_PHOTO → START_RECOMMENDING → RECOMMENDATIONS_READY
      let next = flowReducer(state, {
        type: 'SET_PHOTO',
        payload: originalPhoto,
      });
      expect(next.photo).toEqual(originalPhoto);

      next = flowReducer(next, { type: 'START_RECOMMENDING' });
      expect(next.photo).toEqual(originalPhoto);

      next = flowReducer(next, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: [
          {
            hairstyleId: 's1',
            name: { ko: 'n', en: 'n' },
            reason: 'r',
            tips: ['t'],
            referenceImage: { src: '/img.webp', alt: 'a', credit: 'c' },
            tags: [],
          },
        ] },
      });
      expect(next.photo).toEqual(originalPhoto);
    });

    it('should maintain previewQueue consistency with previews keys', () => {
      const recs = [
        {
          hairstyleId: 'style-1',
          name: { ko: '1', en: '1' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/1.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
        {
          hairstyleId: 'style-2',
          name: { ko: '2', en: '2' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/2.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
      ];
      const next = flowReducer(state, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recs },
      });

      // Queue should contain ids present in previews
      for (const queuedId of next.previewQueue) {
        expect(queuedId in next.previews).toBe(true);
      }
    });
  });

  // ============================================================================
  // selectNextPreviewTarget HELPER
  // ============================================================================
  describe('selectNextPreviewTarget', () => {
    it('should return the first queued id when generatingCount < PREVIEW_CONCURRENCY', () => {
      let state: FlowState = {
        ...initialFlowState,
        previewQueue: ['style-1', 'style-2', 'style-3'],
        generatingCount: 0,
        previews: {
          'style-1': { status: 'idle' },
          'style-2': { status: 'idle' },
          'style-3': { status: 'idle' },
        },
      };

      const target = selectNextPreviewTarget(state);
      expect(target).toBe('style-1');
    });

    it('should return null when queue is empty', () => {
      const state: FlowState = {
        ...initialFlowState,
        previewQueue: [],
      };

      const target = selectNextPreviewTarget(state);
      expect(target).toBeNull();
    });

    it('should return null when generatingCount >= PREVIEW_CONCURRENCY', () => {
      const state: FlowState = {
        ...initialFlowState,
        previewQueue: ['style-1'],
        generatingCount: 2, // MAX is 2
        previews: {
          'style-1': { status: 'idle' },
        },
      };

      const target = selectNextPreviewTarget(state);
      expect(target).toBeNull();
    });
  });

  // ============================================================================
  // REGRESSION: Preview Queue Starvation Bug (A)
  // ============================================================================
  describe('Preview Queue Starvation Fix', () => {
    beforeEach(() => {
      const recs = [
        {
          hairstyleId: 'id-1',
          name: { ko: '1', en: '1' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/1.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
        {
          hairstyleId: 'id-2',
          name: { ko: '2', en: '2' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/2.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
        {
          hairstyleId: 'id-3',
          name: { ko: '3', en: '3' },
          reason: 'r',
          tips: ['t'],
          referenceImage: { src: '/3.webp', alt: 'a', credit: 'c' },
          tags: [],
        },
      ];
      state = flowReducer(state, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: recs },
      });
    });

    it('should dequeue id when PREVIEW_STARTED (prevent starvation)', () => {
      const initialQueue = [...state.previewQueue];
      expect(initialQueue).toContain('id-1');
      expect(initialQueue).toContain('id-2');

      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });

      // id-1 should be removed from queue
      expect(next.previewQueue).not.toContain('id-1');
      expect(next.previewQueue).toContain('id-2');
      expect(next.previewQueue).toContain('id-3');
    });

    it('should select id-2 after id-1 is started (no double-selection)', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });

      const nextTarget = selectNextPreviewTarget(next);
      expect(nextTarget).toBe('id-2');
    });

    it('should handle two concurrent PREVIEW_STARTED calls without queue starvation', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });
      expect(next.generatingCount).toBe(1);

      next = flowReducer(next, {
        type: 'PREVIEW_STARTED',
        payload: 'id-2',
      });
      expect(next.generatingCount).toBe(2);
      expect(next.previewQueue).not.toContain('id-1');
      expect(next.previewQueue).not.toContain('id-2');
      expect(next.previewQueue).toContain('id-3');

      // Next target should be null (concurrency limit reached)
      const nextTarget = selectNextPreviewTarget(next);
      expect(nextTarget).toBeNull();
    });

    it('should enable id-3 selection after id-1 completes', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });
      next = flowReducer(next, {
        type: 'PREVIEW_STARTED',
        payload: 'id-2',
      });

      // id-1 done
      next = flowReducer(next, {
        type: 'PREVIEW_DONE',
        payload: { id: 'id-1', imageDataUrl: 'data:...' },
      });

      // Now id-3 should be available
      const nextTarget = selectNextPreviewTarget(next);
      expect(nextTarget).toBe('id-3');
    });

    it('should be idempotent: duplicate PREVIEW_STARTED on same id is no-op', () => {
      let next = flowReducer(state, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });
      const afterFirstStart = { ...next };

      // Try to start id-1 again (should be no-op since already generating)
      next = flowReducer(next, {
        type: 'PREVIEW_STARTED',
        payload: 'id-1',
      });

      expect(next.generatingCount).toBe(afterFirstStart.generatingCount); // No increment
      expect(next.previewQueue).toEqual(afterFirstStart.previewQueue); // Unchanged
      expect(next.previews['id-1']).toEqual(afterFirstStart.previews['id-1']); // Unchanged
    });

    it('should complete full 6-recommendation sequence without starvation', () => {
      // Add more recs for a full sequence test
      const manyRecs = Array.from({ length: 6 }, (_, i) => ({
        hairstyleId: `style-${i + 1}`,
        name: { ko: `${i + 1}`, en: `${i + 1}` },
        reason: 'r',
        tips: ['t'],
        referenceImage: { src: '/img.webp', alt: 'a', credit: 'c' },
        tags: [],
      }));

      state = flowReducer(state, {
        type: 'RECOMMENDATIONS_READY',
        payload: { recommendations: manyRecs },
      });

      expect(state.previewQueue).toHaveLength(6);

      // Simulate concurrent generation: start 1, start 2, done 1, start 3, ...
      let next = state;
      const allDone = [];

      // Start id 1 and 2
      next = flowReducer(next, { type: 'PREVIEW_STARTED', payload: 'style-1' });
      expect(next.generatingCount).toBe(1);

      next = flowReducer(next, { type: 'PREVIEW_STARTED', payload: 'style-2' });
      expect(next.generatingCount).toBe(2);

      // Complete 1, auto-select 3
      next = flowReducer(next, {
        type: 'PREVIEW_DONE',
        payload: { id: 'style-1', imageDataUrl: 'data:...' },
      });
      expect(next.generatingCount).toBe(1);
      allDone.push('style-1');

      // Manually start 3
      next = flowReducer(next, { type: 'PREVIEW_STARTED', payload: 'style-3' });
      expect(next.generatingCount).toBe(2);

      // Continue until all done
      for (const id of ['style-2', 'style-3', 'style-4', 'style-5', 'style-6']) {
        next = flowReducer(next, {
          type: 'PREVIEW_DONE',
          payload: { id, imageDataUrl: 'data:...' },
        });
        allDone.push(id);
      }

      expect(next.generatingCount).toBe(0);
      expect(allDone).toHaveLength(6);
    });
  });

  // ============================================================================
  // REGRESSION: Analyzing Stage Wiring (B)
  // ============================================================================
  describe('Analyzing Stage Wiring', () => {
    it('should have START_ANALYZING action to transition to analyzing stage', () => {
      state.entryPath = 'photo';
      state.stage = 'dropzone';
      state.photo = {
        objectUrl: 'blob:...',
        mimeType: 'image/jpeg',
        data: 'base64...',
      };

      const action: FlowAction = { type: 'START_ANALYZING' } as any;
      const next = flowReducer(state, action);

      expect(next.stage).toBe('analyzing');
      expect(next.photo).toEqual(state.photo); // Photo preserved
    });

    it('should preserve preferences and photo in analyzing stage', () => {
      state.stage = 'dropzone';
      state.entryPath = 'photo';
      state.photo = {
        objectUrl: 'blob:test',
        mimeType: 'image/jpeg',
        data: 'base64',
      };
      state.preferences = {
        preference: 'feminine',
        length: 'medium',
        occasion: 'event',
      };

      const next = flowReducer(state, { type: 'START_ANALYZING' } as any);

      expect(next.preferences).toEqual(state.preferences);
      expect(next.photo).toEqual(state.photo);
      expect(next.stage).toBe('analyzing');
    });

    it('ANALYZE_FAILED should return to dropzone (not error) with photo preserved', () => {
      state.stage = 'analyzing';
      state.photo = {
        objectUrl: 'blob:test',
        mimeType: 'image/jpeg',
        data: 'base64',
      };

      const next = flowReducer(state, {
        type: 'ANALYZE_FAILED',
        payload: { code: 'NO_FACE_DETECTED', message: 'No face in image' },
      });

      expect(next.stage).toBe('dropzone'); // Return to upload, not error dead-end
      expect(next.photo).toEqual(state.photo); // Photo preserved for re-upload
      expect(next.error).toEqual({
        code: 'NO_FACE_DETECTED',
        message: 'No face in image',
      });
    });

    it('should support full flow: dropzone → analyzing → attributes (success)', () => {
      state.stage = 'dropzone';
      state.photo = {
        objectUrl: 'blob:test',
        mimeType: 'image/jpeg',
        data: 'base64',
      };

      // Transition to analyzing
      let next = flowReducer(state, { type: 'START_ANALYZING' } as any);
      expect(next.stage).toBe('analyzing');

      // Analysis complete
      const analysis = {
        faceShape: 'oval' as const,
        confidence: 0.9,
        gender: 'male' as const,
        features: ['symmetrical'],
      };
      next = flowReducer(next, {
        type: 'PHOTO_ANALYZED',
        payload: analysis,
      });

      expect(next.stage).toBe('attributes');
      expect(next.faceShape).toBe('oval');
      expect(next.photo).toEqual(state.photo); // Photo still retained
    });

    it('should support flow: dropzone → analyzing → dropzone (failure, retry)', () => {
      state.stage = 'dropzone';
      state.photo = {
        objectUrl: 'blob:test',
        mimeType: 'image/jpeg',
        data: 'base64',
      };

      let next = flowReducer(state, { type: 'START_ANALYZING' } as any);
      expect(next.stage).toBe('analyzing');

      // Analysis fails
      next = flowReducer(next, {
        type: 'ANALYZE_FAILED',
        payload: { code: 'NO_FACE_DETECTED', message: 'No face found' },
      });

      expect(next.stage).toBe('dropzone'); // Back to upload
      expect(next.photo).toEqual(state.photo); // Photo available for retry
      expect(next.error).toBeDefined();

      // User dismisses error and re-uploads, or taps "no photo" → manual pick
      next = flowReducer(next, {
        type: 'CHOOSE_ENTRY',
        payload: 'manual',
      });
      expect(next.stage).toBe('facepicker');
      expect(next.error).toBeNull(); // Error cleared
    });
  });

  // ============================================================================
  // SET_FACE_PREVIEW (Rev 2)
  // ============================================================================
  describe('SET_FACE_PREVIEW', () => {
    it('should toggle facePreviewEnabled to true', () => {
      state.facePreviewEnabled = false;
      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: true,
      };
      const next = flowReducer(state, action);

      expect(next.facePreviewEnabled).toBe(true);
    });

    it('should toggle facePreviewEnabled to false', () => {
      state.facePreviewEnabled = true;
      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: false,
      };
      const next = flowReducer(state, action);

      expect(next.facePreviewEnabled).toBe(false);
    });

    it('should no-op when not in results stage', () => {
      state.stage = 'attributes';
      state.facePreviewEnabled = true;
      const originalState = { ...state };

      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: false,
      };
      const next = flowReducer(state, action);

      expect(next.facePreviewEnabled).toBe(false);
      expect(next.stage).toBe('attributes'); // Stage unchanged
    });

    it('should no-op when toggling to current state in results stage', () => {
      state.stage = 'results';
      state.facePreviewEnabled = true;
      state.recommendations = [
        {
          hairstyleId: 'style-1',
          name: { ko: 'style', en: 'style' },
          reason: 'reason',
          tips: ['tip'],
          referenceImage: { src: '/img.webp', alt: 'alt', credit: 'credit' },
          tags: [],
        },
      ];
      state.previews = { 'style-1': { status: 'done', imageDataUrl: 'data:...' } };

      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: true, // Same as current state
      };
      const next = flowReducer(state, action);

      // Should preserve existing previews (no requeue)
      expect(next.facePreviewEnabled).toBe(true);
      expect(next.previews['style-1'].status).toBe('done');
      expect(next.previewQueue.length).toBe(0);
    });

    it('should invalidate and requeue all previews when toggling in results stage', () => {
      state.stage = 'results';
      state.facePreviewEnabled = true;
      state.recommendations = [
        {
          hairstyleId: 'style-1',
          name: { ko: 'style1', en: 'style1' },
          reason: 'reason',
          tips: ['tip'],
          referenceImage: { src: '/img.webp', alt: 'alt', credit: 'credit' },
          tags: [],
        },
        {
          hairstyleId: 'style-2',
          name: { ko: 'style2', en: 'style2' },
          reason: 'reason',
          tips: ['tip'],
          referenceImage: { src: '/img.webp', alt: 'alt', credit: 'credit' },
          tags: [],
        },
      ];
      state.previews = {
        'style-1': { status: 'done', imageDataUrl: 'data:...' },
        'style-2': { status: 'generating' },
      };
      state.generatingCount = 1;

      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: false, // Toggle OFF
      };
      const next = flowReducer(state, action);

      expect(next.facePreviewEnabled).toBe(false);
      // All previews should be reset to idle
      expect(next.previews['style-1'].status).toBe('idle');
      expect(next.previews['style-2'].status).toBe('idle');
      // Queue should contain both style IDs
      expect(next.previewQueue).toEqual(['style-1', 'style-2']);
      // Generating count should reset
      expect(next.generatingCount).toBe(0);
    });

    it('should handle empty recommendations gracefully', () => {
      state.stage = 'results';
      state.facePreviewEnabled = true;
      state.recommendations = [];
      state.previews = {};

      const action: FlowAction = {
        type: 'SET_FACE_PREVIEW',
        payload: false,
      };
      const next = flowReducer(state, action);

      expect(next.facePreviewEnabled).toBe(false);
      expect(next.previewQueue.length).toBe(0);
      expect(next.generatingCount).toBe(0);
    });
  });

  // ============================================================================
  // PREVIEW_FAILED with unknown hairstyleId
  // ============================================================================
  describe('PREVIEW_FAILED edge cases', () => {
    it('should ignore PREVIEW_FAILED for unknown hairstyleId', () => {
      state.stage = 'results';
      state.recommendations = [
        {
          hairstyleId: 'known-style',
          name: { ko: 'style', en: 'style' },
          reason: 'reason',
          tips: ['tip'],
          referenceImage: { src: '/img.webp', alt: 'alt', credit: 'credit' },
          tags: [],
        },
      ];
      state.previews = { 'known-style': { status: 'idle' } };
      const originalState = JSON.stringify(state);

      const action: FlowAction = {
        type: 'PREVIEW_FAILED',
        payload: 'unknown-style',
      };
      const next = flowReducer(state, action);

      expect(JSON.stringify(next)).toBe(originalState);
    });
  });

  // ============================================================================
  // DEFAULT CASE (unknown action type)
  // ============================================================================
  describe('unknown actions', () => {
    it('should return state unchanged for unknown action type', () => {
      const action = { type: 'UNKNOWN_ACTION', payload: null } as any;
      const next = flowReducer(state, action);

      expect(next).toEqual(state);
    });
  });
});
