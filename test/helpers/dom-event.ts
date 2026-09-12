import { Event as HappyDomEvent } from "happy-dom";

// DOM tests use browser typings, but must dispatch events from the simulated DOM.
export const TestEvent = HappyDomEvent as unknown as typeof Event;
