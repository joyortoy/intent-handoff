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

export async function registerWebMcpTools(): Promise<{
  available: boolean;
  api: ReturnType<typeof webmcpApiName>;
  registered: string[];
}> {
  controller?.abort();
  controller = new AbortController();
  const ctx = getModelContext();
  const api = webmcpApiName();

  if (!ctx || typeof ctx.registerTool !== "function") {
    setWebmcpStatus({
      available: false,
      api,
      registeredTools: TOOLS.map((tool) => tool.name),
      lastDiscovery: new Date().toISOString(),
    });
    return { available: false, api, registered: TOOLS.map((tool) => tool.name) };
  }

  for (const tool of TOOLS) {
    await ctx.registerTool(
      {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        execute: async (input, extras) => {
          if (extras?.signal?.aborted) throw new Error("Tool execution aborted");
          return tool.execute(input ?? {});
        },
      },
      { signal: controller.signal },
    );
  }

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
