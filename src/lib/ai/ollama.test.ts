/**
 * OllamaClient Tests
 * Tests StructuredModel and ImageGenerator implementations via mocked fetch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('./env', () => ({
  getOllamaBaseUrl: () => 'http://localhost:11434',
  getOllamaVisionModel: () => 'qwen3-vl:8b',
  getOllamaTextModel: () => 'qwen3.5:9b',
  getOllamaImageModel: () => 'x/z-image-turbo',
  readRuntimeEnv: () => undefined,
}));

import { OllamaClient } from './ollama';
import { AiError } from './types';

describe('OllamaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('generateJson', () => {
    const testSchema = z.object({
      value: z.string(),
      count: z.number(),
    });

    it('calls /api/chat endpoint with vision model for images', async () => {
      const responseJson = { value: 'test', count: 42 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      const result = await client.generateJson({
        prompt: 'analyze image',
        image: { data: 'base64data', mimeType: 'image/jpeg' },
        schema: testSchema,
      });

      expect(result).toEqual(responseJson);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
        })
      );

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.model).toBe('qwen3-vl:8b'); // vision model
      expect(callBody.messages[0].images).toBeDefined();
    });

    it('calls /api/chat endpoint with text model for text-only', async () => {
      const responseJson = { value: 'test', count: 1 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      await client.generateJson({
        prompt: 'text prompt',
        schema: testSchema,
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.model).toBe('qwen3.5:9b'); // text model
      expect(callBody.messages[0].images).toBeUndefined();
    });

    it('handles data: URL prefix in image data', async () => {
      const responseJson = { value: 'test', count: 1 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      await client.generateJson({
        prompt: 'test',
        image: { data: 'data:image/jpeg;base64,abc123', mimeType: 'image/jpeg' },
        schema: testSchema,
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.messages[0].images[0]).toBe('abc123');
    });

    it('throws AiError on fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const client = new OllamaClient();
      await expect(
        client.generateJson({
          prompt: 'test',
          schema: testSchema,
        })
      ).rejects.toThrow(AiError);
    });

    it('retries on empty response', async () => {
      const responseJson = { value: 'test', count: 1 };
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: { content: '' }, // Empty
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: { content: JSON.stringify(responseJson) },
          }),
        } as any);

      const client = new OllamaClient();
      const result = await client.generateJson({
        prompt: 'test',
        schema: testSchema,
        maxRetries: 1,
      });

      expect(result).toEqual(responseJson);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('respects custom baseUrl', async () => {
      const responseJson = { value: 'test', count: 1 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient('http://ollama.example.com:11434');
      await client.generateJson({
        prompt: 'test',
        schema: testSchema,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://ollama.example.com:11434/api/chat',
        expect.any(Object)
      );
    });

    it('passes through gender field from provider response', async () => {
      const genderSchema = z.object({
        gender: z.enum(['male', 'female', 'unknown']).catch('unknown'),
      });

      const responseJson = { gender: 'female' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      const result = await client.generateJson({
        prompt: 'analyze gender',
        schema: genderSchema,
      });

      expect(result.gender).toBe('female');
    });

    it('coerces missing gender to unknown', async () => {
      const genderSchema = z.object({
        gender: z.enum(['male', 'female', 'unknown']).catch('unknown'),
      });

      const responseJson = {}; // No gender field
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      const result = await client.generateJson({
        prompt: 'analyze gender',
        schema: genderSchema,
      });

      expect(result.gender).toBe('unknown');
    });

    it('coerces invalid gender to unknown', async () => {
      const genderSchema = z.object({
        gender: z.enum(['male', 'female', 'unknown']).catch('unknown'),
      });

      const responseJson = { gender: 'not-a-gender' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(responseJson) },
        }),
      } as any);

      const client = new OllamaClient();
      const result = await client.generateJson({
        prompt: 'analyze gender',
        schema: genderSchema,
      });

      expect(result.gender).toBe('unknown');
    });
  });

  describe('generateImage', () => {
    it('calls /v1/images/generations endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ b64_json: 'iVBORw0KGgo=' }],
        }),
      } as any);

      const client = new OllamaClient();
      const result = await client.generateImage({
        prompt: 'a beautiful sunset',
      });

      expect(result.data).toBe('iVBORw0KGgo=');
      expect(result.mimeType).toBe('image/png');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/v1/images/generations',
        expect.any(Object)
      );
    });

    it('passes width and height (clamped to max 1024)', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ b64_json: 'abc' }],
        }),
      } as any);

      const client = new OllamaClient();
      await client.generateImage({
        prompt: 'test',
        width: 2000, // Over max
        height: 512,
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.size).toBe('1024x512'); // width clamped
    });

    it('includes seed if provided', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ b64_json: 'abc' }],
        }),
      } as any);

      const client = new OllamaClient();
      await client.generateImage({
        prompt: 'test',
        seed: 12345,
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.seed).toBe(12345);
    });

    it('throws AiError on fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      const client = new OllamaClient();
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(AiError);
    });

    it('throws AiError if no image data in response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [], // No images
        }),
      } as any);

      const client = new OllamaClient();
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(AiError);
    });

    it('supportsImageEdit is false', () => {
      const client = new OllamaClient();
      expect(client.supportsImageEdit).toBe(false);
    });
  });

  describe('timeout handling', () => {
    it('aborts fetch if timeout exceeds', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      global.fetch = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) => setTimeout(() => reject(abortError), 10))
        );

      const client = new OllamaClient(undefined, undefined, undefined, undefined, 5); // 5ms timeout
      await expect(
        client.generateJson({
          prompt: 'test',
          schema: z.object({ value: z.string() }),
        })
      ).rejects.toThrow(AiError);
    });
  });
});
