interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMcpToolExecuteOptions {
  signal: AbortSignal;
}

interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: WebMcpToolAnnotations;
  execute: (input: Record<string, unknown>, options: WebMcpToolExecuteOptions) => Promise<unknown>;
}

interface WebMcpRegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: WebMcpToolAnnotations;
}

interface WebMcpModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal; exposedTo?: string[] }): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<WebMcpRegisteredTool[]>;
}

interface Document {
  readonly modelContext?: WebMcpModelContext;
}

interface WindowEventMap {
  "buildcheck:webmcp-status": CustomEvent<{ supported: boolean; registered: number; error?: string }>;
}
