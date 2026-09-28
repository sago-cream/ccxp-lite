import { readFileSync } from "node:fs";
import { expect, test, vi } from "vitest";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

const manifest = JSON.parse(readFileSync("src/manifest.base.json", "utf8")) as {
  content_scripts: ReadonlyArray<{ matches: readonly string[]; js?: readonly string[] }>;
};
const predictors = new Map([
  ["login/auth/decaptcha.js", "decaptcha"],
  ["inquire/decaptcha.js", "inquireDecaptcha"],
  ["oauth/decaptcha.js", "oauthDecaptcha"],
] as const);

test.each(
  manifest.content_scripts.flatMap(({ matches, js = [] }) =>
    js.some((file) => file.endsWith("/decaptcha.js")) ? [[matches[0], js] as const] : [],
  ),
)("manifest order initializes captcha predictors for %s", async (_match, scripts) => {
  const { window } = createTestWindow();
  try {
    loadModules(
      window,
      scripts
        .filter((file) => file.endsWith("/decaptcha.js"))
        .map((file) => `src/${file.replace(/\.js$/, ".ts")}`),
    );
    for (const [file, property] of predictors) {
      if (scripts.includes(file)) {
        expect(window.CCXP_LITE[property]?.predictDigits).toBeTypeOf("function");
      }
    }
  } finally {
    await window.happyDOM.close();
  }
});

test.each([
  ["DOM canvas with natural dimensions", false, 2, 3],
  ["DOM canvas with fallback dimensions", false, 0, 0],
  ["offscreen canvas", true, 2, 3],
] as const)(
  "decodes image pixels using %s",
  async (_label, offscreen, naturalWidth, naturalHeight) => {
    const { window } = createTestWindow();
    const document = window.document as unknown as Document;
    const image = document.createElement("img");
    image.width = 4;
    image.height = 5;
    Object.defineProperties(image, {
      naturalWidth: { value: naturalWidth },
      naturalHeight: { value: naturalHeight },
    });
    const width = naturalWidth > 0 ? naturalWidth : image.width;
    const height = naturalHeight > 0 ? naturalHeight : image.height;
    const pixels = new Uint8ClampedArray(width * height * 4).fill(127);
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: pixels })),
    };
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "getContext", { value: () => context });
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(canvas);
    class TestOffscreenCanvas {
      width: number;
      height: number;
      context = context;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.width = canvasWidth;
        this.height = canvasHeight;
      }

      getContext() {
        return this.context;
      }
    }
    Object.defineProperty(window, "OffscreenCanvas", {
      value: offscreen ? TestOffscreenCanvas : undefined,
    });
    try {
      loadModules(window, ["src/shared/decaptcha.ts"]);
      const operations = requireValue(window.CCXP_LITE.decaptchaShared);
      expect(operations.decodeImageElement(image)).toEqual({ width, height, data: pixels });
      expect(context.drawImage).toHaveBeenCalledExactlyOnceWith(image, 0, 0);
      expect(context.getImageData).toHaveBeenCalledExactlyOnceWith(0, 0, width, height);
      expect(createElement).toHaveBeenCalledTimes(offscreen ? 0 : 1);
      if (!offscreen) {
        expect([canvas.width, canvas.height]).toEqual([width, height]);
      }
    } finally {
      createElement.mockRestore();
      await window.happyDOM.close();
    }
  },
);
