/// <reference types="vite/client" />

type WebMcpInputSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

type WebMcpToolDefinition = {
  name: string;
  description: string;
  inputSchema: WebMcpInputSchema;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    extras?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
};

type WebMcpRegisteredTool = {
  name: string;
  description: string;
  inputSchema: WebMcpInputSchema;
  annotations?: Record<string, unknown>;
  origin?: string;
  title?: string;
};

interface ModelContext {
  registerTool: (
    tool: WebMcpToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void> | void;
  getTools?: (options?: { fromOrigins?: string[] }) => Promise<WebMcpRegisteredTool[]>;
  executeTool?: (
    tool: WebMcpRegisteredTool,
    argsJson: string,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
  addEventListener?: (type: "toolchange", listener: () => void) => void;
}

interface Document {
  modelContext?: ModelContext;
}

interface Navigator {
  modelContext?: ModelContext;
}
