import { ToolDefinition } from '../providers/types';

export interface Tool {
  definition: ToolDefinition;
  execute(args: Record<string, string>): Promise<string>;
}
