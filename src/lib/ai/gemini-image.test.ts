/**
 * GeminiImageClient Tests (Mocked Fetch)
 *
 * Tests plain-fetch REST API calls to Google Generative AI.
 * NO real API calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./env', () => ({
  getGeminiApiKey: () => undefined,
  getGeminiImageModel: () => 'gemini-2.5-flash-image',
  readRuntimeEnv: () => undefined,
}));

import { GeminiImageClient } from './gemini-image';
import { AiError } from './types';

describe('GeminiImageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('constructor', () => {
    it('throws AiError if no API key provided and env is empty', () => {
      expect(() => new GeminiImageClient('')).toThrow(AiError);
    });

    it('accepts API key parameter', () => {
      const client = new GeminiImageClient('test-key');
      expect(client).toBeDefined();
    });

    it('has supportsImageEdit = true', () => {
      const client = new GeminiImageClient('test-key');
      expect(client.supportsImageEdit).toBe(true);
    });
  });

  describe('generateImage', () => {
    it('calls REST API with text-only prompt', async () => {
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: mockBase64,
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      const result = await client.generateImage({
        prompt: 'a beautiful sunset',
      });

      expect(result.data).toBe(mockBase64);
      expect(result.mimeType).toBe('image/png');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-goog-api-key': 'test-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.contents[0].parts).toHaveLength(1);
      expect(callBody.contents[0].parts[0]).toEqual({ text: 'a beautiful sunset' });
    });

    it('includes reference image (edit mode) in request', async () => {
      const mockBase64 = 'iVBORw0KGgo=';
      const refImage = 'abc123def456';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { mimeType: 'image/png', data: mockBase64 } }],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      await client.generateImage({
        prompt: 'hairstyle edit prompt',
        referenceImage: { data: refImage, mimeType: 'image/jpeg' },
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.contents[0].parts).toHaveLength(2);
      expect(callBody.contents[0].parts[0]).toEqual({
        inlineData: { mimeType: 'image/jpeg', data: refImage },
      });
      expect(callBody.contents[0].parts[1]).toEqual({
        text: 'hairstyle edit prompt',
      });
    });

    it('strips data: URL prefix from reference image', async () => {
      const mockBase64 = 'iVBORw0KGgo=';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { mimeType: 'image/png', data: mockBase64 } }],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      await client.generateImage({
        prompt: 'test',
        referenceImage: {
          data: 'data:image/jpeg;base64,abc123',
          mimeType: 'image/jpeg',
        },
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      expect(callBody.contents[0].parts[0].inlineData.data).toBe('abc123');
    });

    it('clamps mimeType to image/png or image/jpeg', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/webp', // Unknown type
                      data: 'iVBORw0KGgo=',
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      const result = await client.generateImage({ prompt: 'test' });

      expect(result.mimeType).toBe('image/png'); // Defaults to png
    });

    it('returns image/jpeg if that is in response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: 'iVBORw0KGgo=',
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      const result = await client.generateImage({ prompt: 'test' });

      expect(result.mimeType).toBe('image/jpeg');
    });

    it('throws AiError if no image part in response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Some text response instead of image',
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow('No image data in Gemini response');
    });

    it('throws AiError on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const client = new GeminiImageClient('test-key');
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow('Gemini image generation error: 500');
    });

    it('throws AiError on 429 rate limit', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as any);

      const client = new GeminiImageClient('test-key');
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(AiError);
    });

    it('throws AiError on fetch abort timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      global.fetch = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) => setTimeout(() => reject(abortError), 10))
        );

      const client = new GeminiImageClient('test-key', undefined, 5); // 5ms timeout
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(AiError);
      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow('timeout');
    });

    it('ignores width, height, and seed parameters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: { mimeType: 'image/png', data: 'abc' },
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient('test-key');
      await client.generateImage({
        prompt: 'test',
        width: 512,
        height: 768,
        seed: 42,
      });

      const callBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      );
      // width, height, seed are not sent to API
      expect(callBody).toEqual({
        contents: [
          {
            parts: [{ text: 'test' }],
          },
        ],
      });
    });

    it('respects custom model', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: { mimeType: 'image/png', data: 'abc' },
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const client = new GeminiImageClient(
        'test-key',
        'gemini-2.0-flash-001'
      );
      await client.generateImage({ prompt: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-2.0-flash-001'),
        expect.any(Object)
      );
    });
  });
});
