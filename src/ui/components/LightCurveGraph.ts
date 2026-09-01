export class LightCurveGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private history: number[];
  private readonly historyLength = 160;
  private minFlux = 0.98;
  private maxFlux = 1.01;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to acquire 2D context for LightCurveGraph');
    this.ctx = context;
    this.history = new Array(this.historyLength).fill(1.0);
    this.resize();
  }

  public resize(): void {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 400;
    const height = rect.height > 0 ? rect.height : 150;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // 60 FPS Rule: Circular buffer shift & push without unbounded allocations
  public pushFlux(fluxValue: number, maxExpectedDipPercent: number): void {
    this.history.push(fluxValue);
    this.history.shift();

    const maxDipFraction = maxExpectedDipPercent / 100.0;
    this.minFlux = Math.min(0.985, 1.0 - maxDipFraction * 1.3);
    this.maxFlux = 1.005;
  }

  public getCurrentFlux(): number {
    return this.history[this.history.length - 1];
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  // 60 FPS Draw Budget: Execution under 1.5ms
  public render(isTransiting: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 400;
    const height = rect.height > 0 ? rect.height : 150;

    // Background fill
    this.ctx.fillStyle = '#05070e';
    this.ctx.fillRect(0, 0, width, height);

    // Grid lines with flux metrics
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = (height / gridLines) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();

      const fluxLevel = this.maxFlux - (i / gridLines) * (this.maxFlux - this.minFlux);
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px monospace';
      this.ctx.fillText(fluxLevel.toFixed(4), 6, y - 4);
    }

    // High-precision vector light curve path
    this.ctx.beginPath();
    this.ctx.strokeStyle = isTransiting ? '#ff007f' : '#00f2fe';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = isTransiting ? 'rgba(255, 0, 127, 0.6)' : 'rgba(0, 242, 254, 0.5)';
    this.ctx.shadowBlur = 8;

    const range = Math.max(0.0001, this.maxFlux - this.minFlux);
    for (let i = 0; i < this.history.length; i++) {
      const x = (i / (this.history.length - 1)) * width;
      const normalizedY = (this.history[i] - this.minFlux) / range;
      const y = height - normalizedY * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Active tracker bead at current time index
    const currentFlux = this.history[this.history.length - 1];
    const lastX = width - 2;
    const lastNormalizedY = (currentFlux - this.minFlux) / range;
    const lastY = height - lastNormalizedY * height;

    this.ctx.fillStyle = isTransiting ? '#ff007f' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
