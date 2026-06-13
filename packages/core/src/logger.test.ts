import { describe, it, expect } from "vitest";
import { getAppLogger } from "./logger.js";

describe("getAppLogger", () => {
  it("binds the component name onto the child logger", () => {
    const log = getAppLogger("agents.triage");
    expect(log.bindings().component).toBe("agents.triage");
  });

  it("tags two components distinctly", () => {
    expect(getAppLogger("a").bindings().component).toBe("a");
    expect(getAppLogger("b").bindings().component).toBe("b");
  });

  it("exposes standard log methods", () => {
    const log = getAppLogger("x");
    expect(typeof log.info).toBe("function");
    expect(typeof log.debug).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });
});
