import { describe, it, expect } from 'vitest';
import { LightCurveGraph } from '../../src/ui/components/LightCurveGraph';

// Minimal canvas mock for node environment
function createMockCanvas(): HTMLCanvasElement {
  return {
    width: 400,
    height: 150,
    getBoundingClientRect: () => ({ width: 400, height: 150, top: 0, left: 0, right: 400, bottom: 150, x: 0, y: 0 }),
    getContext: () => ({
      scale: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillText: () => {},
      arc: () => {},
      fill: () => {}
    })
  } as unknown as HTMLCanvasElement;
}

describe('LightCurveGraph Canvas 2D Photometry Engine', () => {
  it('maintains strict 160-point ring buffer invariant', () => {
    const canvas = createMockCanvas();
    const graph = new LightCurveGraph(canvas);

    expect(graph.getHistoryLength()).toBe(160);
    expect(graph.getCurrentFlux()).toBe(1.0);

    for (let i = 0; i < 50; i++) {
      graph.pushFlux(0.995, 1.0);
    }
    expect(graph.getHistoryLength()).toBe(160);
    expect(graph.getCurrentFlux()).toBe(0.995);

    for (let i = 0; i < 200; i++) {
      graph.pushFlux(1.0, 1.0);
    }
    expect(graph.getHistoryLength()).toBe(160);
    expect(graph.getCurrentFlux()).toBe(1.0);
  });

  it('executes render call within 1.5ms 60 FPS performance budget', () => {
    const canvas = createMockCanvas();
    const graph = new LightCurveGraph(canvas);

    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      graph.render(true);
    }
    const t1 = performance.now();
    const avgDuration = (t1 - t0) / 10;

    expect(avgDuration).toBeLessThan(1.5);
  });
});
