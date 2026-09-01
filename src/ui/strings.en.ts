// Centralized User-Facing String Catalog (Localization Readiness)
export const strings = {
  app: {
    title: 'COSMOSCAN',
    subtitle: 'Production Exoplanet Analyzer & 3D Milky Way Suite',
    versionBadge: 'NASA ARCHIVE & GAIA DR3 INTEGRATED',
    audioOn: 'Sound: ON',
    audioOff: 'Sound: OFF',
    targetsQuickView: 'Key Targets',
    cameraHome: 'Reset Galaxy View',
    cameraOrbit: 'Orbit Planet View'
  },
  search: {
    placeholder: 'Search 4,600+ exoplanets or host stars...',
    noResults: 'No planetary systems matching query',
    resultsLabel: 'Search suggestions'
  },
  hud: {
    hostStarHeader: 'Host Star Telemetry',
    planetHeader: 'Exoplanet Orbital Physics',
    lightCurveHeader: 'Real-Time Transit Photometry (Mandel-Agol)',
    verdictHeader: 'Astrobiological Assessment',
    distanceEarth: 'Distance from Earth',
    effectiveTemp: 'Effective Temperature',
    stellarRadius: 'Stellar Radius',
    semiMajorAxis: 'Semi-Major Axis',
    orbitalPeriod: 'Orbital Period',
    planetaryRadius: 'Planetary Radius',
    transitDepth: 'Photometric Dip (ΔF)',
    transitDuration: 'Transit Duration'
  },
  accessibility: {
    transitActive: 'Transit in progress: planetary occultation detected',
    transitIdle: 'Out of transit: baseline stellar flux normalized',
    searchExpanded: 'Search suggestions expanded',
    searchCollapsed: 'Search suggestions collapsed'
  },
  attribution: {
    nasa: 'Data courtesy of NASA Exoplanet Archive (IPAC/Caltech).',
    gaia: 'Astrometric cross-matching via ESA Gaia DR3 Data Processing and Analysis Consortium (DPAC).'
  }
};
