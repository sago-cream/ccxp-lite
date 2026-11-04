import { tokens } from "@ccxp-lite/tokens";
import { expect, test } from "vitest";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("action text retains AA contrast on its supported surfaces", () => {
  for (const color of [tokens.colorPrimary, tokens.colorDanger]) {
    expect(contrast(color, tokens.colorSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color, tokens.colorSurfaceMuted)).toBeGreaterThanOrEqual(4.5);
  }
});
