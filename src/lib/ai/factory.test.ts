/**
 * Factory Tests
 * Tests provider instantiation based on environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as envModule from './env';

vi.mock('./env');
vi.mock('./gemini');
vi.mock('./gemini-image');
vi.mock('./ollama');

import { getStructuredModel, getImageGenerator } from './factory';
import { AiError } from './types';
import { GeminiClient } from './gemini';
import { GeminiImageClient } from './gemini-image';
import { OllamaClient } from './ollama';

describe('factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStructuredModel', () => {
    it('returns GeminiClient for gemini provider', () => {
      vi.mocked(envModule.getAiProvider).mockReturnValue('gemini');

      const result = getStructuredModel();
      expect(result).toBeInstanceOf(GeminiClient);
    });

    it('returns OllamaClient for ollama provider', () => {
      vi.mocked(envModule.getAiProvider).mockReturnValue('ollama');

      const result = getStructuredModel();
      expect(result).toBeInstanceOf(OllamaClient);
    });

    it('throws AiError for unknown provider', () => {
      vi.mocked(envModule.getAiProvider).mockReturnValue('unknown-provider');

      expect(() => getStructuredModel()).toThrow(AiError);
    });
  });

  describe('getImageGenerator', () => {
    it('returns GeminiImageClient for gemini provider', () => {
      vi.mocked(envModule.getImageProvider).mockReturnValue('gemini');

      const result = getImageGenerator();
      expect(result).toBeInstanceOf(GeminiImageClient);
    });

    it('returns OllamaClient for ollama provider', () => {
      vi.mocked(envModule.getImageProvider).mockReturnValue('ollama');

      const result = getImageGenerator();
      expect(result).toBeInstanceOf(OllamaClient);
    });

    it('returns null if IMAGE_PROVIDER is unset', () => {
      vi.mocked(envModule.getImageProvider).mockReturnValue(undefined);

      const result = getImageGenerator();
      expect(result).toBeNull();
    });

    it('returns null for unknown provider', () => {
      vi.mocked(envModule.getImageProvider).mockReturnValue('unknown');

      const result = getImageGenerator();
      expect(result).toBeNull();
    });
  });
});
