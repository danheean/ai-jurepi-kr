/**
 * Tests for POST /api/hairstyle/preview
 *
 * Tests rate limiting, validation, image generator availability,
 * and proper error mapping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { getImageGenerator } from '@/lib/ai/factory';
import { checkRateLimit } from '@/lib/rate-limit';
import { HAIRSTYLE_LIBRARY } from '@/lib/hairstyle-recommendation';
import { AiError } from '@/lib/ai/types';

// Mock dependencies
vi.mock('@/lib/ai/factory');
vi.mock('@/lib/rate-limit');

describe('POST /api/hairstyle/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('200 - Success', () => {
    it('should return a preview image when all conditions are met', async () => {
      // Arrange
      const mockGenerator = {
        supportsImageEdit: false,
        generateImage: vi.fn().mockResolvedValue({
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png' as const,
        }),
      };

      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(mockGenerator);

      const validHairstyleId = HAIRSTYLE_LIBRARY[0].id;
      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: validHairstyleId,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.image).toMatch(/^data:image\/png;base64,/);
      expect(json.data.mimeType).toBe('image/png');
      expect(json.error).toBeNull();

      // Verify generator was called with correct dimensions
      expect(mockGenerator.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.any(String),
          width: 768,
          height: 960,
        })
      );
    });

    it('should handle both locales (ko and en)', async () => {
      const mockGenerator = {
        supportsImageEdit: false,
        generateImage: vi.fn().mockResolvedValue({
          data: 'IMAGEDATA',
          mimeType: 'image/png' as const,
        }),
      };

      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(mockGenerator);

      for (const locale of ['ko', 'en'] as const) {
        const request = new NextRequest(
          'http://localhost/api/hairstyle/preview',
          {
            method: 'POST',
            body: JSON.stringify({
              hairstyleId: HAIRSTYLE_LIBRARY[0].id,
              locale,
            }),
          }
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('400 - Validation Errors', () => {
    it('should return 400 when hairstyleId is not found in catalog', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: 'nonexistent-id-12345',
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.data).toBeNull();
    });

    it('should return 400 when hairstyleId is missing', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when locale is invalid', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'invalid',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: 'not json',
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject extra fields (strict schema)', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
          extraField: 'should be rejected',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('429 - Rate Limit', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        retryAfterSeconds: 45,
      });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('RATE_LIMITED');
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should use default retry-after if not provided', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
      });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('503 - Image Generator Disabled', () => {
    it('should return 503 when IMAGE_PROVIDER is not configured', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('IMAGE_GEN_DISABLED');
      expect(json.data).toBeNull();
    });
  });

  describe('502 - AI Unavailable', () => {
    it('should return 502 when generator throws AI_UNAVAILABLE', async () => {
      // Arrange
      const mockGenerator = {
        supportsImageEdit: false,
        generateImage: vi
          .fn()
          .mockRejectedValue(
            new AiError('AI_UNAVAILABLE', 'Ollama connection failed')
          ),
      };

      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(mockGenerator);

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(502);
      expect(json.error.code).toBe('AI_UNAVAILABLE');
    });

    it('should return 502 when generator throws unexpected error', async () => {
      // Arrange
      const mockGenerator = {
        supportsImageEdit: false,
        generateImage: vi
          .fn()
          .mockRejectedValue(new Error('Unknown provider error')),
      };

      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(mockGenerator);

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(502);
      expect(json.error.code).toBe('AI_UNAVAILABLE');
    });
  });

  describe('500 - Internal Error', () => {
    it('should return 500 for unexpected route-level errors', async () => {
      // Arrange: Mock checkRateLimit to throw an unexpected error
      vi.mocked(checkRateLimit).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(json.error.code).toBe('INTERNAL');
    });
  });

  describe('IP extraction and rate limit endpoint', () => {
    it('should extract IP from cf-connecting-ip header', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Simulate Cloudflare header
      Object.defineProperty(request, 'headers', {
        value: new Map([['cf-connecting-ip', '192.168.1.1']]),
      });

      vi.mocked(getImageGenerator).mockReturnValue({
        supportsImageEdit: false,
        generateImage: vi
          .fn()
          .mockResolvedValue({
            data: 'test',
            mimeType: 'image/png',
          }),
      });

      // Act
      await POST(request);

      // Assert
      expect(checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('192.168'),
        expect.objectContaining({
          endpoint: 'hairstyle-preview',
          requestsPerMinute: 30,
        })
      );
    });
  });

  describe('Ephemeral data handling', () => {
    it('should not log or persist image data', async () => {
      // Arrange
      const mockGenerator = {
        supportsImageEdit: false,
        generateImage: vi.fn().mockResolvedValue({
          data: 'SECRET_IMAGE_DATA',
          mimeType: 'image/png' as const,
        }),
      };

      vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
      vi.mocked(getImageGenerator).mockReturnValue(mockGenerator);

      const consoleSpy = vi.spyOn(console, 'error');

      const request = new NextRequest('http://localhost/api/hairstyle/preview', {
        method: 'POST',
        body: JSON.stringify({
          hairstyleId: HAIRSTYLE_LIBRARY[0].id,
          locale: 'ko',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      // Verify that console.error was never called (would indicate leaked data)
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
