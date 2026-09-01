export type ParticleTier = 'FULL' | 'REDUCED' | 'MINIMAL';

export interface ParticleTierConfig {
  tier: ParticleTier;
  particleBudget: number;
}

export function detectParticleTier(gl?: WebGLRenderingContext | WebGL2RenderingContext | null): ParticleTierConfig {
  if (typeof window === 'undefined') {
    return { tier: 'FULL', particleBudget: 150000 };
  }

  // Mobile / Safari detection or missing WebGL2 float blending
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!gl) {
    if (isMobile) return { tier: 'REDUCED', particleBudget: 60000 };
    if (isSafari) return { tier: 'REDUCED', particleBudget: 60000 };
    return { tier: 'FULL', particleBudget: 150000 };
  }

  const isWebGL2 = 'FLOAT' in gl;
  if (!isWebGL2) {
    return { tier: 'MINIMAL', particleBudget: 20000 };
  }

  const floatBlend = gl.getExtension('EXT_float_blend');
  if (!floatBlend || isMobile) {
    return { tier: 'REDUCED', particleBudget: 60000 };
  }

  return { tier: 'FULL', particleBudget: 150000 };
}
