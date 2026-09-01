import { logger } from './logger';

export class PerformanceSampler {
  private frameTimes: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;
  private currentFPS = 60;

  public sample(): number {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    if (delta > 0) {
      // Clamp between 0 and 240 FPS to prevent microsecond CPU loop spikes
      const instantFPS = Math.min(240, Math.max(0, 1000 / Math.max(4.0, delta)));
      this.frameTimes.push(instantFPS);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
    }

    // Every 60 frames (~1 second at 60 FPS), compute average FPS
    if (this.frameCount % 60 === 0) {
      const sum = this.frameTimes.reduce((acc, f) => acc + f, 0);
      this.currentFPS = Math.round(sum / this.frameTimes.length);

      if (this.currentFPS < 50) {
        logger.warn('Performance', `FPS dropped below 60 target (Current: ${this.currentFPS} FPS)`, {
          currentFPS: this.currentFPS,
          sampleCount: this.frameTimes.length
        });
      }
    }

    return this.currentFPS;
  }

  public getFPS(): number {
    return this.currentFPS;
  }
}
