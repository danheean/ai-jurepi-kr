/**
 * Guardrails Tests
 * Tests JSON extraction, validation, and retry logic.
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import {
  extractJsonFromResponse,
  validateJson,
  retryJsonExtraction,
} from './guardrails';
import { AiError } from './types';

describe('guardrails', () => {
  describe('extractJsonFromResponse', () => {
    it('extracts raw JSON', () => {
      const text = '{"key": "value"}';
      expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
    });

    it('removes markdown json fence', () => {
      const text = '```json\n{"key": "value"}\n```';
      expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
    });

    it('removes markdown fence without json label', () => {
      const text = '```\n{"key": "value"}\n```';
      expect(extractJsonFromResponse(text)).toBe('{"key": "value"}');
    });

    it('handles text before/after fence', () => {
      const text = 'Here is the JSON:\n```json\n{"key": "value"}\n```\nEnd of response';
      // This test documents that we only remove the fences, not surrounding text
      const result = extractJsonFromResponse(text);
      expect(result).toContain('{"key": "value"}');
    });

    it('returns null for empty string', () => {
      expect(extractJsonFromResponse('')).toBe(null);
    });

    it('returns null for whitespace-only string', () => {
      expect(extractJsonFromResponse('   \n  ')).toBe(null);
    });

    it('returns null for non-JSON text', () => {
      expect(extractJsonFromResponse('This is not JSON')).toBe(
        'This is not JSON'
      );
    });
  });

  describe('validateJson', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().int().min(0).max(150),
    });

    it('validates correct JSON', () => {
      const json = '{"name": "Alice", "age": 30}';
      const result = validateJson(json, schema);
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('throws AiError on invalid JSON', () => {
      const json = '{invalid json}';
      expect(() => validateJson(json, schema)).toThrow(AiError);
      try {
        validateJson(json, schema);
      } catch (err) {
        if (err instanceof AiError) {
          expect(err.code).toBe('VALIDATION_ERROR');
          expect(err.message).toContain('JSON parse failed');
        }
      }
    });

    it('throws AiError on schema violation', () => {
      const json = '{"name": "Alice", "age": 999}'; // age > 150
      expect(() => validateJson(json, schema)).toThrow(AiError);
      try {
        validateJson(json, schema);
      } catch (err) {
        if (err instanceof AiError) {
          expect(err.code).toBe('VALIDATION_ERROR');
          expect(err.message).toContain('Schema validation failed');
        }
      }
    });

    it('throws AiError on missing required fields', () => {
      const json = '{"name": "Alice"}';
      expect(() => validateJson(json, schema)).toThrow(AiError);
    });
  });

  describe('retryJsonExtraction', () => {
    const schema = z.object({ value: z.string() });

    it('returns validated result on first call', async () => {
      const generateFn = vi.fn().mockResolvedValueOnce('{"value": "success"}');
      const result = await retryJsonExtraction(generateFn, schema, 1);
      expect(result).toEqual({ value: 'success' });
      expect(generateFn).toHaveBeenCalledTimes(1);
    });

    it('retries on extraction failure', async () => {
      const generateFn = vi
        .fn()
        .mockResolvedValueOnce('') // First call fails
        .mockResolvedValueOnce('{"value": "success"}'); // Second succeeds
      const result = await retryJsonExtraction(generateFn, schema, 1);
      expect(result).toEqual({ value: 'success' });
      expect(generateFn).toHaveBeenCalledTimes(2);
    });

    it('throws AiError after exhausting retries', async () => {
      const generateFn = vi.fn().mockResolvedValue(''); // Always empty
      await expect(
        retryJsonExtraction(generateFn, schema, 1)
      ).rejects.toThrow(AiError);
      expect(generateFn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });

    it('does not retry on validation error', async () => {
      const generateFn = vi
        .fn()
        .mockResolvedValueOnce('{"value": 123}'); // Wrong type
      await expect(
        retryJsonExtraction(generateFn, schema, 1)
      ).rejects.toThrow(AiError);
      expect(generateFn).toHaveBeenCalledTimes(1); // No retry on validation error
    });

    it('handles markdown fences before validation', async () => {
      const generateFn = vi
        .fn()
        .mockResolvedValueOnce('```json\n{"value": "success"}\n```');
      const result = await retryJsonExtraction(generateFn, schema, 1);
      expect(result).toEqual({ value: 'success' });
    });

    it('respects maxRetries parameter', async () => {
      const generateFn = vi.fn().mockResolvedValue(''); // Always empty
      await expect(
        retryJsonExtraction(generateFn, schema, 0) // No retries
      ).rejects.toThrow(AiError);
      expect(generateFn).toHaveBeenCalledTimes(1); // Only initial call
    });
  });
});
