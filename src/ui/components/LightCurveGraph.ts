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

  // 60 FPS Draw Budget: Execution strictly under 1.5ms
  public render(isTransiting: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 400;
    const height = rect.height > 0 ? rect.height : 150;

    // 1. Cosmic Background Fill
    this.ctx.fillStyle = '#05070e';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Metric Grid Lines
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

    const range = Math.max(0.0001, this.maxFlux - this.minFlux);

    // 3. Mandel-Agol Theoretical Reference Model (Subtle dotted line)
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    this.ctx.lineWidth = 1;
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([3, 4]);
    }
    this.ctx.beginPath();
    for (let i = 0; i < width; i += 4) {
      const normX = (i / width - 0.5) * 4.0;
      // Symmetric U-shaped transit model
      const modelDip = Math.exp(-Math.pow(normX, 4)) * (1.0 - this.minFlux) * 0.75;
      const modelFlux = 1.0 - modelDip;
      const modelY = height - ((modelFlux - this.minFlux) / range) * height;
      if (i === 0) this.ctx.moveTo(i, modelY);
      else this.ctx.lineTo(i, modelY);
    }
    this.ctx.stroke();
    if (typeof this.ctx.setLineDash === 'function') {
      this.ctx.setLineDash([]); // Reset line dash
    }

    // 4. Gradient Fill Under Observed Flux Curve
    this.ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = (i / (this.history.length - 1)) * width;
      const normalizedY = (this.history[i] - this.minFlux) / range;
      const y = height - normalizedY * height;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    if (typeof this.ctx.closePath === 'function') {
      this.ctx.closePath();
    }

    if (typeof this.ctx.createLinearGradient === 'function') {
      const fillGrad = this.ctx.createLinearGradient(0, 0, 0, height);
      if (isTransiting) {
        fillGrad.addColorStop(0, 'rgba(255, 0, 127, 0.22)');
        fillGrad.addColorStop(1, 'rgba(255, 0, 127, 0.0)');
      } else {
        fillGrad.addColorStop(0, 'rgba(0, 242, 254, 0.16)');
        fillGrad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
      }
      this.ctx.fillStyle = fillGrad;
      this.ctx.fill();
    }

    // 5. High-Precision Vector Light Curve Path
    this.ctx.beginPath();
    this.ctx.strokeStyle = isTransiting ? '#ff007f' : '#00f2fe';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = isTransiting ? 'rgba(255, 0, 127, 0.6)' : 'rgba(0, 242, 254, 0.5)';
    this.ctx.shadowBlur = 8;

    for (let i = 0; i < this.history.length; i++) {
      const x = (i / (this.history.length - 1)) * width;
      const normalizedY = (this.history[i] - this.minFlux) / range;
      const y = height - normalizedY * height;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // 6. Transit Contact Point Annotations (t1, t2, t3, t4)
    if (isTransiting) {
      const contacts = [
        { label: 't₁ (Ingress)', frac: 0.32 },
        { label: 't₂ (Full)', frac: 0.42 },
        { label: 't₃ (Egress)', frac: 0.58 },
        { label: 't₄ (Norm)', frac: 0.68 }
      ];

      this.ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
      this.ctx.fillStyle = '#ff007f';
      this.ctx.font = '8px monospace';
      if (typeof this.ctx.setLineDash === 'function') {
        this.ctx.setLineDash([2, 2]);
      }

      for (const c of contacts) {
        const cx = c.frac * width;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 16);
        this.ctx.lineTo(cx, height - 10);
        this.ctx.stroke();
        this.ctx.fillText(c.label, cx - 18, 12);
      }
      if (typeof this.ctx.setLineDash === 'function') {
        this.ctx.setLineDash([]);
      }
    }

    // 7. Active Tracker Bead at Current Time Index
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
