import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function rgb(hex) {
  const value = hex.replace('#', '');
  const expanded =
    value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  return [0, 2, 4].map((start) =>
    parseInt(expanded.slice(start, start + 2), 16),
  );
}
function luminance(channels) {
  const linear = channels.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear.reduce(
    (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
    0,
  );
}
function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

test('Actual functional theme colours meet WCAG AA text and focus contrast', () => {
  const css = readFileSync(
    new URL('../frontend/src/index.css', import.meta.url),
    'utf8',
  );
  const tokens = Object.fromEntries(
    [...css.matchAll(/--color-([\w-]+):\s*(#[\da-f]+)/gi)].map((match) => [
      match[1],
      rgb(match[2]),
    ]),
  );
  for (const [foreground, background] of [
    ['foreground', 'background'],
    ['card-foreground', 'card'],
    ['primary-foreground', 'primary'],
    ['secondary-foreground', 'secondary'],
    ['muted-foreground', 'muted'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'card'],
    ['accent-foreground', 'accent'],
    ['destructive-foreground', 'destructive'],
  ]) {
    const ratio = contrast(tokens[foreground], tokens[background]);
    assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio}:1`);
  }
  for (const background of ['background', 'card']) {
    assert.ok(
      contrast(tokens.ring, tokens[background]) >= 3,
      `Focus ring on ${background}`,
    );
    assert.ok(
      contrast(tokens.input, tokens[background]) >= 3,
      `Input border on ${background}`,
    );
  }
});

test('Hero shade protects normal white text even over a white photograph', () => {
  const css = readFileSync(
    new URL('../frontend/src/styles/reference-hero.css', import.meta.url),
    'utf8',
  );
  const shade = [
    ...css.matchAll(/\.em-reference-hero-shade\s*\{([^}]+)\}/g),
  ].find((match) => match[1].includes('linear-gradient'))?.[1];
  assert.ok(shade, 'The actual hero shade must define its background');
  const stops = [
    ...shade.matchAll(
      /rgba\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)/g,
    ),
  ];
  assert.ok(
    stops.length >= 2,
    'The actual shade must expose its gradient stops',
  );
  for (const match of stops) {
    const alpha = Number(match[4]);
    const brightest = [match[1], match[2], match[3]].map(
      (value) => Number(value) * alpha + 255 * (1 - alpha),
    );
    const ratio = contrast([255, 255, 255], brightest);
    assert.ok(
      ratio >= 4.5,
      `Normal hero text at shade alpha ${alpha}: ${ratio}:1`,
    );
  }
});
