import { setWebmcpStatus } from "../core/store";
import { TOOLS, type ToolDefinition } from "./tools";

export function getModelContext(): ModelContext | null {
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  return null;
}

export function webmcpApiName(): "document.modelContext" | "navigator.modelContext" | "unavailable" {
  if (typeof document !== "undefined" && document.modelContext) return "document.modelContext";
  if (typeof navigator !== "undefined" && navigator.modelContext) return "navigator.modelContext";
  return "unavailable";
}

let controller: AbortController | null = null;
let registeredFor: ModelContext | null = null;
let watchTimer: number | null = null;

function markUnavailable() {
  setWebmcpStatus({
    available: false,
    api: webmcpApiName(),
    registeredTools: TOOLS.map((tool) => tool.name),
    lastDiscovery: new Date().toISOString(),
  });
}

async function registerOne(ctx: ModelContext, tool: ToolDefinition, signal: AbortSignal) {
  const definition = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations,
    execute: async (input: Record<string, unknown>, extras?: { signal?: AbortSignal }) => {
      if (extras?.signal?.aborted || signal.aborted) throw new Error("Tool execution aborted");
      return tool.execute(input ?? {});
    },
  };

  try {
    await ctx.registerTool(definition, { signal });
  } catch {
    await ctx.registerTool(definition);
  }
}

export async function registerWebMcpTools(): Promise<{
  available: boolean;
  api: ReturnType<typeof webmcpApiName>;
  registered: string[];
}> {
  const ctx = getModelContext();
  const api = webmcpApiName();

  if (!ctx || typeof ctx.registerTool !== "function") {
    markUnavailable();
    return { available: false, api, registered: TOOLS.map((tool) => tool.name) };
  }

  if (registeredFor === ctx) {
    return { available: true, api, registered: TOOLS.map((tool) => tool.name) };
  }

  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;

  for (const tool of TOOLS) {
    await registerOne(ctx, tool, signal);
  }

  registeredFor = ctx;

  let discovered: string[] = TOOLS.map((tool) => tool.name);
  if (typeof ctx.getTools === "function") {
    try {
      const listed = await ctx.getTools();
      discovered = listed.map((tool) => tool.name);
    } catch {
      discovered = TOOLS.map((tool) => tool.name);
    }
  }

  setWebmcpStatus({
    available: true,
    api,
    registeredTools: discovered,
    lastDiscovery: new Date().toISOString(),
  });

  return { available: true, api, registered: discovered };
}

/** ChatGPT/Codex may inject document.modelContext after first paint. Keep trying. */
export function beginWebMcpWatch() {
  void registerWebMcpTools();
  if (typeof window === "undefined" || watchTimer != null) return;

  const startedAt = Date.now();
  watchTimer = window.setInterval(() => {
    if (getModelContext()) {
      void registerWebMcpTools();
      if (watchTimer != null) window.clearInterval(watchTimer);
      watchTimer = null;
      return;
    }
    if (Date.now() - startedAt > 20000 && watchTimer != null) {
      window.clearInterval(watchTimer);
      watchTimer = null;
    }
  }, 300);
}

export async function invokeTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const ctx = getModelContext();
  if (ctx && typeof ctx.getTools === "function" && typeof ctx.executeTool === "function") {
    const listed = await ctx.getTools();
    const registered = listed.find((tool) => tool.name === name);
    if (registered) {
      return ctx.executeTool(registered, JSON.stringify(args));
    }
  }
  const tool: ToolDefinition = TOOLS.find((item) => item.name === name)!;
  return tool.execute(args);
}
