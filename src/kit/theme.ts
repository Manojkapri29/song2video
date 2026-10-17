/** Design tokens. A preset reads only from here, so a new look is one object, not a rewrite. */
export type Theme = {
  name: string;
  bg: string;
  ink: string;        // primary text
  dim: string;        // not-yet-active text
  accent: string;     // highlight / underline
  accent2: string;    // secondary accent, gradients
  display: 'display' | 'serif' | 'sans';   // which face the big type uses
  light?: boolean;    // light themes get a pale scrim and petals instead of embers
};

export const THEMES: Record<string, Theme> = {
  // channel default: temple saffron + gold on near-black
  katha: {name: 'katha', bg: '#0b0806', ink: '#fff6e8', dim: 'rgba(255,224,184,.38)',
    accent: '#ff7a1a', accent2: '#ffc24b', display: 'display'},
  // cold documentary look for facts / mystery
  mystery: {name: 'mystery', bg: '#05080d', ink: '#eaf2ff', dim: 'rgba(200,220,255,.34)',
    accent: '#3ea6ff', accent2: '#7cf2d4', display: 'sans'},
  // clean light, for explainers and data
  paper: {name: 'paper', bg: '#f6f1e7', ink: '#17130f', dim: 'rgba(23,19,15,.32)',
    accent: '#c2410c', accent2: '#1d4ed8', display: 'serif'},
  // warm light romance: soft cream, rose and gold, for love songs
  romance: {name: 'romance', bg: '#fbf1e6', ink: '#3a2219', dim: 'rgba(58,34,25,.34)',
    accent: '#d4567a', accent2: '#c98a2e', display: 'serif', light: true},
  // high-contrast social post
  punch: {name: 'punch', bg: '#101014', ink: '#ffffff', dim: 'rgba(255,255,255,.3)',
    accent: '#f6f03c', accent2: '#ff3b6b', display: 'display'},
};

export const themeOf = (n?: string): Theme => THEMES[n ?? 'katha'] ?? THEMES.katha;
