import { Tool } from './types';
import { readFileTool, writeFileTool, editFileTool, listFilesTool, createDirTool, deleteFileTool } from './file';
import { runShellTool } from './shell';
import { webFetchTool } from './web';

export const ALL_TOOLS: Record<string, Tool> = {
  read_file: readFileTool,
  write_file: writeFileTool,
  edit_file: editFileTool,
  list_files: listFilesTool,
  create_dir: createDirTool,
  delete_file: deleteFileTool,
  run_shell: runShellTool,
  web_fetch: webFetchTool,
};

export function getToolsForAgent(toolNames: string[]): Tool[] {
  return toolNames.filter((name) => ALL_TOOLS[name]).map((name) => ALL_TOOLS[name]);
}

export function getAllToolNames(): string[] {
  return Object.keys(ALL_TOOLS);
}

export * from './types';
