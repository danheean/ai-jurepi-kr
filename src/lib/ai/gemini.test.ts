/**
 * GeminiClient Tests (Mocked SDK)
 *
 * These tests mock the @google/generative-ai SDK entirely.
 * NO real API calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

vi.mock('./env', () => ({
  getGeminiApiKey: () => undefined, // No default key in test env
  getGeminiModel: () => 'gemini-flash-latest',
  readRuntimeEnv: () => undefined,
}));

import { GeminiClient } from './gemini';
import { AiError } from './types';

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockClear();
    mockGenerateContent.mockReset();
  });

  describe('constructor', () => {
    it('throws AiError if no API key provided and env is empty', () => {
      expect(() => new GeminiClient('')).toThrow(AiError);
    });

    it('accepts API key parameter', () => {
      const client = new GeminiClient('custom-key');
      expect(client).toBeDefined();
    });
  });

  describe('generateJson', () => {
    const testSchema = z.object({
      value: z.string(),
      count: z.number(),
    });

    it('returns validated JSON on successful response', async () => {
      const responseJson = { value: 'test', count: 42 };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'test prompt',
        schema: testSchema,
      });

      expect(result).toEqual(responseJson);
    });

    it('handles markdown-wrapped JSON', async () => {
      const responseJson = { value: 'test', count: 42 };
      const wrappedJson = `\`\`\`json\n${JSON.stringify(responseJson)}\n\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => wrappedJson,
        },
      });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'test prompt',
        schema: testSchema,
      });

      expect(result).toEqual(responseJson);
    });

    it('supports vision input (image)', async () => {
      const responseJson = { value: 'oval', count: 1 };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'analyze this face',
        image: {
          data: 'iVBORw0KGgo=', // Fake base64
          mimeType: 'image/jpeg',
        },
        schema: testSchema,
      });

      expect(result).toEqual(responseJson);
      // Verify the image was passed to generateContent
      expect(mockGenerateContent).toHaveBeenCalled();
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents[0].parts[0].inlineData).toBeDefined();
    });

    it('handles data: URL prefix in image data', async () => {
      const responseJson = { value: 'test', count: 1 };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
      await client.generateJson({
        prompt: 'test',
        image: {
          data: 'data:image/jpeg;base64,iVBORw0KGgo=',
          mimeType: 'image/jpeg',
        },
        schema: testSchema,
      });

      const callArgs = mockGenerateContent.mock.calls[0][0];
      // Verify data: prefix was stripped
      expect(callArgs.contents[0].parts[0].inlineData.data).toBe('iVBORw0KGgo=');
    });

    it('retries on empty response', async () => {
      const responseJson = { value: 'test', count: 42 };
      mockGenerateContent
        .mockResolvedValueOnce({
          response: {
            text: () => '', // Empty
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(responseJson),
          },
        });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'test',
        schema: testSchema,
        maxRetries: 1,
      });

      expect(result).toEqual(responseJson);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('throws AiError on validation failure', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '{"value": "test"}', // Missing 'count' field
        },
      });

      const client = new GeminiClient('test-key');
      await expect(
        client.generateJson({
          prompt: 'test',
          schema: testSchema,
        })
      ).rejects.toThrow(AiError);
    });

    it('throws AiError on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '{invalid json}',
        },
      });

      const client = new GeminiClient('test-key');
      await expect(
        client.generateJson({
          prompt: 'test',
          schema: testSchema,
          maxRetries: 0,
        })
      ).rejects.toThrow(AiError);
    });

    it('passes through gender field from provider response', async () => {
      const genderSchema = z.object({
        gender: z.enum(['male', 'female', 'unknown']).catch('unknown'),
      });

      const responseJson = { gender: 'male' };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'analyze gender',
        schema: genderSchema,
      });

      expect(result.gender).toBe('male');
    });

    it('coerces missing gender to unknown', async () => {
      const genderSchema = z.object({
        gender: z.enum(['male', 'female', 'unknown']).catch('unknown'),
      });

      const responseJson = {}; // No gender field
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
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

      const responseJson = { gender: 'invalid-value' };
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(responseJson),
        },
      });

      const client = new GeminiClient('test-key');
      const result = await client.generateJson({
        prompt: 'analyze gender',
        schema: genderSchema,
      });

      expect(result.gender).toBe('unknown');
    });
  });
});
