import { spawn, ChildProcess } from 'child_process';
import { getConfig, saveConfig, McpServerConfig } from '../config';
import { ToolDefinition } from '../providers/types';

const MAX_MCP_RESULT_SIZE = 50 * 1024; // 50 KB max per tool result

// ─── JSON-RPC Types ──────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// ─── Connection State ────────────────────────────────────────────────────────

export type McpStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

interface McpConnection {
  process: ChildProcess;
  tools: McpTool[];
  resources: McpResource[];
  buffer: string;
  pending: Map<number, { resolve: (v: JsonRpcResponse) => void; reject: (e: Error) => void }>;
  nextId: number;
  status: McpStatus;
  connectedAt: Date;
  callCount: number;
  lastError?: string;
  serverInfo?: { name?: string; version?: string };
}

const connections: Map<string, McpConnection> = new Map();

// ─── JSON-RPC Core ───────────────────────────────────────────────────────────

function sendRequest(conn: McpConnection, method: string, params?: unknown, timeoutMs = 15000): Promise<JsonRpcResponse> {
  const id = conn.nextId++;
  const req: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (conn.pending.has(id)) {
        conn.pending.delete(id);
        reject(new Error(`Timeout after ${timeoutMs}ms — ${method}`));
      }
    }, timeoutMs);

    conn.pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject:  (e) => { clearTimeout(timer); reject(e); },
    });

    conn.process.stdin!.write(JSON.stringify(req) + '\n');
  });
}

function handleData(conn: McpConnection, data: string): void {
  conn.buffer += data;
  const lines = conn.buffer.split('\n');
  conn.buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line) as JsonRpcResponse;
      const pending = conn.pending.get(msg.id);
      if (pending) {
        conn.pending.delete(msg.id);
        pending.resolve(msg);
      }
    } catch {
      // non-JSON line or notification — ignore
    }
  }
}

// ─── Connect ─────────────────────────────────────────────────────────────────

export async function connectMcp(name: string): Promise<string> {
  if (connections.has(name)) {
    const existing = connections.get(name)!;
    if (existing.status === 'connected') {
      return `Already connected to "${name}" (${existing.tools.length} tools, ${existing.resources.length} resources)`;
    }
    connections.delete(name);
  }

  const config = getConfig();
  const serverConfig: McpServerConfig | undefined = config.mcpServers[name];
  if (!serverConfig) return `❌ MCP server "${name}" not found — use /mcp add or /mcp install`;

  try {
    const proc = spawn(serverConfig.command, serverConfig.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(serverConfig.env || {}) },
      shell: process.platform === 'win32',
    });

    const conn: McpConnection = {
      process: proc,
      tools: [],
      resources: [],
      buffer: '',
      pending: new Map(),
      nextId: 1,
      status: 'connecting',
      connectedAt: new Date(),
      callCount: 0,
    };

    proc.stdout!.on('data', (d: Buffer) => handleData(conn, d.toString()));
    proc.stderr!.on('data', () => {});
    proc.on('exit', (code) => {
      const c = connections.get(name);
      if (c) {
        c.status = 'disconnected';
        c.lastError = code !== 0 ? `Process exited with code ${code}` : undefined;
      }
    });

    // MCP handshake
    const initRes = await sendRequest(conn, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: {} },
      clientInfo: { name: 'devhive', version: '1.0.0' },
    });

    if (initRes.error) throw new Error(initRes.error.message);

    const initResult = initRes.result as { serverInfo?: { name?: string; version?: string } };
    conn.serverInfo = initResult?.serverInfo;

    // Send initialized notification
    proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    // List tools
    const toolsRes = await sendRequest(conn, 'tools/list', {});
    const toolsResult = toolsRes.result as { tools?: McpTool[] };
    conn.tools = toolsResult?.tools || [];

    // List resources (non-fatal)
    try {
      const resRes = await sendRequest(conn, 'resources/list', {}, 3000);
      const resResult = resRes.result as { resources?: McpResource[] };
      conn.resources = resResult?.resources || [];
    } catch {
      conn.resources = [];
    }

    conn.status = 'connected';
    connections.set(name, conn);

    const serverLabel = conn.serverInfo?.name ? ` (${conn.serverInfo.name} ${conn.serverInfo.version || ''})`.trim() : '';
    const resourceLine = conn.resources.length ? `, ${conn.resources.length} resources` : '';
    return `✅ Connected to "${name}"${serverLabel} — ${conn.tools.length} tools${resourceLine}`;

  } catch (err: unknown) {
    const error = err as { message?: string };
    const msg = error.message || String(err);
    return `❌ Failed to connect to "${name}": ${msg}`;
  }
}

// Auto-connect all saved servers marked as autoConnect
export async function autoConnectServers(): Promise<void> {
  const config = getConfig();
  const toConnect = Object.entries(config.mcpServers)
    .filter(([, s]) => (s as McpServerConfig & { autoConnect?: boolean }).autoConnect)
    .map(([name]) => name);

  await Promise.allSettled(toConnect.map((n) => connectMcp(n)));
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export function disconnectMcp(name: string): string {
  const conn = connections.get(name);
  if (!conn) return `Not connected to "${name}"`;
  conn.process.kill();
  connections.delete(name);
  return `✅ Disconnected from "${name}"`;
}

// ─── Tool Execution ──────────────────────────────────────────────────────────

export async function callMcpTool(serverName: string, toolName: string, args: unknown): Promise<string> {
  const conn = connections.get(serverName);
  if (!conn) return `❌ Not connected to MCP server "${serverName}" — run /mcp connect ${serverName}`;
  if (conn.status !== 'connected') return `❌ MCP server "${serverName}" is ${conn.status}`;

  try {
    conn.callCount++;
    const res = await sendRequest(conn, 'tools/call', { name: toolName, arguments: args });
    if (res.error) return `❌ MCP error: ${res.error.message}`;

    const content = (res.result as { content?: Array<{ type: string; text?: string; data?: string }> })?.content || [];
    let result = content
      .map((c) => {
        if (c.text) return c.text;
        if (c.data) return `[binary data, ${c.data.length} chars base64]`;
        return JSON.stringify(c);
      })
      .join('\n');

    // Enforce max result size to prevent context overflow
    if (result.length > MAX_MCP_RESULT_SIZE) {
      result = result.slice(0, MAX_MCP_RESULT_SIZE) +
        `\n…[truncated — ${result.length - MAX_MCP_RESULT_SIZE} chars omitted]`;
    }

    return result;
  } catch (err: unknown) {
    const error = err as { message?: string };
    return `❌ Tool call failed: ${error.message || String(err)}`;
  }
}

// ─── Tool Definitions (for LLM) ──────────────────────────────────────────────

export function getMcpToolDefinitions(): ToolDefinition[] {
  const defs: ToolDefinition[] = [];
  for (const [serverName, conn] of connections) {
    if (conn.status !== 'connected') continue;
    for (const tool of conn.tools) {
      defs.push({
        type: 'function',
        function: {
          name: `mcp__${serverName}__${tool.name}`,
          description: `[MCP:${serverName}] ${tool.description}`,
          parameters: {
            type: 'object',
            properties: tool.inputSchema?.properties || {},
            required: tool.inputSchema?.required || [],
          },
        },
      });
    }
  }
  return defs;
}

// ─── Resource Access ─────────────────────────────────────────────────────────

export async function readMcpResource(serverName: string, uri: string): Promise<string> {
  const conn = connections.get(serverName);
  if (!conn) return `❌ Not connected to "${serverName}"`;

  const res = await sendRequest(conn, 'resources/read', { uri });
  if (res.error) return `❌ ${res.error.message}`;

  const contents = (res.result as { contents?: Array<{ text?: string; blob?: string }> })?.contents || [];
  return contents.map((c) => c.text || '[binary]').join('\n');
}

// ─── Config Management ───────────────────────────────────────────────────────

export function addMcpServer(
  name: string,
  command: string,
  args: string[],
  env?: Record<string, string>,
  autoConnect = false
): void {
  const config = getConfig();
  config.mcpServers[name] = { command, args, env, autoConnect } as McpServerConfig & { autoConnect: boolean };
  saveConfig({ mcpServers: config.mcpServers });
}

export function removeMcpServer(name: string): boolean {
  const config = getConfig();
  if (!config.mcpServers[name]) return false;
  delete config.mcpServers[name];
  saveConfig({ mcpServers: config.mcpServers });
  disconnectMcp(name);
  return true;
}

export function setAutoConnect(name: string, enabled: boolean): boolean {
  const config = getConfig();
  if (!config.mcpServers[name]) return false;
  (config.mcpServers[name] as McpServerConfig & { autoConnect: boolean }).autoConnect = enabled;
  saveConfig({ mcpServers: config.mcpServers });
  return true;
}

// ─── Status & Inspection ─────────────────────────────────────────────────────

export interface McpServerStatus {
  name: string;
  status: McpStatus;
  toolCount: number;
  resourceCount: number;
  callCount: number;
  tools: string[];
  resources: McpResource[];
  connectedAt?: Date;
  serverInfo?: { name?: string; version?: string };
  lastError?: string;
}

export function listMcpConnections(): McpServerStatus[] {
  return Array.from(connections.entries()).map(([name, conn]) => ({
    name,
    status: conn.status,
    toolCount: conn.tools.length,
    resourceCount: conn.resources.length,
    callCount: conn.callCount,
    tools: conn.tools.map((t) => t.name),
    resources: conn.resources,
    connectedAt: conn.connectedAt,
    serverInfo: conn.serverInfo,
    lastError: conn.lastError,
  }));
}

export function getMcpToolsForServer(name: string): McpTool[] {
  return connections.get(name)?.tools || [];
}

export function getConnectionStatus(name: string): McpStatus | 'not_configured' {
  if (!connections.has(name)) {
    const config = getConfig();
    return config.mcpServers[name] ? 'disconnected' : 'not_configured';
  }
  return connections.get(name)!.status;
}

// Health check — ping all servers and clean up dead ones
export async function healthCheck(): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  for (const [name, conn] of connections) {
    try {
      await sendRequest(conn, 'ping', {}, 3000);
      results.set(name, true);
    } catch {
      conn.status = 'error';
      results.set(name, false);
    }
  }
  return results;
}
