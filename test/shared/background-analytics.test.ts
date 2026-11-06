import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { describe, expect, test, vi } from "vitest";

function createBackground(apiSecret = "test-secret", measurementId = "G-CCXPLITETEST") {
  const storage: Record<string, unknown> = {};
  type Listener = (
    message: unknown,
    sender: Readonly<object>,
    respond: () => void,
  ) => boolean | undefined;
  const listeners: Listener[] = [];
  const fetch = vi
    .fn<(url: string, request: { body: string }) => Promise<{ ok: boolean; status: number }>>()
    .mockResolvedValue({ ok: true, status: 204 });
  const warn = vi.fn();
  const source = fs
    .readFileSync("src/background/analytics.ts", "utf8")
    .replace('"__CCXP_LITE_GA4_MEASUREMENT_ID__"', JSON.stringify(measurementId))
    .replace('"__CCXP_LITE_GA4_API_SECRET__"', JSON.stringify(apiSecret));
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
    }).outputText,
    {
      URL,
      fetch,
      console: { warn },
      chrome: {
        runtime: {
          onMessage: {
            addListener: (listener: Listener) => {
              listeners.push(listener);
            },
          },
        },
        storage: {
          local: {
            get: (_keys: readonly string[], callback: (values: object) => void) => {
              callback(storage);
            },
            set: (values: object, callback: () => void) => {
              Object.assign(storage, values);
              callback();
            },
          },
        },
      },
    },
  );
  const dispatch = async (params: CcxpLiteAnalyticsParams) => {
    let keptAlive: boolean | undefined;
    await new Promise<void>((resolve) => {
      keptAlive = listeners[0]?.(
        {
          type: "ccxp-lite:analytics-event",
          name: "ccxp_lite_menu_view",
          params,
        },
        {},
        resolve,
      );
    });
    return keptAlive;
  };
  return { dispatch, fetch, warn };
}

describe("background analytics delivery", () => {
  test("keeps the response channel open and delivers mode events with client/session identity", async () => {
    const background = createBackground();
    const results = await Promise.all([
      background.dispatch({ menu_mode: "fullscreen", sidebar_variant: "layered" }),
      background.dispatch({ menu_mode: "sidebar" }),
    ]);
    expect(results).toEqual([true, true]);
    const [url, request] = background.fetch.mock.calls[0] as [string, { body: string }];
    expect(new URL(url).searchParams.get("measurement_id")).toBe("G-CCXPLITETEST");
    expect(new URL(url).searchParams.get("api_secret")).toBe("test-secret");
    interface Payload {
      client_id: string;
      events: Array<{ name: string; params: Record<string, string | number> }>;
    }
    const first = JSON.parse(request.body) as Payload;
    expect(first).toMatchObject({
      events: [
        {
          name: "ccxp_lite_menu_view",
          params: {
            menu_mode: "fullscreen",
            sidebar_variant: "layered",
          },
        },
      ],
    });
    expect(first.client_id).toBeTypeOf("string");
    expect(first.events[0]?.params.session_id).toBeTypeOf("string");
    expect(first.events[0]?.params.engagement_time_msec).toBeGreaterThan(0);
    const second = JSON.parse(background.fetch.mock.calls[1]?.[1].body ?? "{}") as Payload;
    expect(second.client_id).toBe(first.client_id);
    expect(second.events[0]?.params.session_id).toBe(first.events[0]?.params.session_id);
  });

  test.each(["", "__CCXP_LITE_GA4_API_SECRET__"])(
    "disables delivery for unconfigured builds (%s)",
    async (secret) => {
      const background = createBackground(secret);
      await background.dispatch({ menu_mode: "sidebar" });
      await background.dispatch({ menu_mode: "sidebar" });
      expect(background.fetch).not.toHaveBeenCalled();
      expect(background.warn).toHaveBeenCalledTimes(1);
    },
  );

  test("does not send events without a configured runtime measurement ID", async () => {
    const background = createBackground("test-secret", "");
    await background.dispatch({ menu_mode: "sidebar" });
    expect(background.fetch).not.toHaveBeenCalled();
  });

  test("reports rejected requests without logging the API secret", async () => {
    const background = createBackground();
    background.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await background.dispatch({ menu_mode: "sidebar" });
    expect(background.warn).toHaveBeenCalledWith(expect.any(String), 403);
    background.fetch.mockRejectedValueOnce(new Error("request URL contains test-secret"));
    await background.dispatch({ menu_mode: "sidebar" });
    expect(JSON.stringify(background.warn.mock.calls)).not.toContain("test-secret");
  });
});
