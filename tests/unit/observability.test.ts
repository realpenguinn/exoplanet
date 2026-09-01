import { describe, it, expect } from 'vitest';
import { logger } from '../../src/observability/logger';
import { PerformanceSampler } from '../../src/observability/perfSampler';

describe('Observability Logger & Performance Telemetry', () => {
  it('enforces 200-event circular buffer limit without memory growth', () => {
    for (let i = 0; i < 250; i++) {
      logger.info('Test', `Event ${i}`);
    }
    const buffer = logger.dumpBuffer();
    expect(buffer.length).toBe(200);
    expect(buffer[buffer.length - 1].message).toBe('Event 249');
  });

  it('records technical context with zero PII', () => {
    logger.error('Graphics', 'WebGL context lost', { gpuVendor: 'MockVendor', code: 1282 });
    const buffer = logger.dumpBuffer();
    const last = buffer[buffer.length - 1];

    expect(last.level).toBe('error');
    expect(last.scope).toBe('Graphics');
    expect(last.context).toEqual({ gpuVendor: 'MockVendor', code: 1282 });
    expect(last.timestamp).toBeTruthy();
  });

  it('samples frame times and computes rolling average FPS', () => {
    const sampler = new PerformanceSampler();
    for (let i = 0; i < 65; i++) {
      sampler.sample();
    }
    expect(sampler.getFPS()).toBeGreaterThan(0);
    expect(sampler.getFPS()).toBeLessThanOrEqual(1000);
  });
});
