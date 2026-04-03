export type McpCategory =
  | 'files'
  | 'web'
  | 'databases'
  | 'code'
  | 'communication'
  | 'ai'
  | 'utilities'
  | 'cloud';

export interface McpStoreEntry {
  id: string;
  name: string;
  description: string;
  category: McpCategory;
  command: string;
  args: string[];
  envRequired?: string[];
  envOptional?: string[];
  homepage?: string;
  tags: string[];
  popular?: boolean;
  agentRecommended?: string[];
}

export const MCP_STORE: McpStoreEntry[] = [
  // ─── FILES & STORAGE ────────────────────────────────────────────────────
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read/write files and directories on your system. Essential for file operations.',
    category: 'files',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '{path}'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    tags: ['files', 'read', 'write', 'directory'],
    popular: true,
    agentRecommended: ['coder', 'frontend', 'backend', 'devops'],
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent knowledge graph memory. Agents can store and retrieve facts across sessions.',
    category: 'ai',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    tags: ['memory', 'knowledge', 'persistence', 'graph'],
    popular: true,
    agentRecommended: ['orchestrator', 'assistant', 'planner'],
  },

  // ─── WEB & SEARCH ───────────────────────────────────────────────────────
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch web content and convert to markdown. Superior web browsing for agents.',
    category: 'web',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    tags: ['web', 'http', 'scrape', 'markdown'],
    popular: true,
    agentRecommended: ['researcher', 'assistant'],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web and local search using Brave Search API. Privacy-first search engine.',
    category: 'web',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    envRequired: ['BRAVE_API_KEY'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    tags: ['search', 'web', 'brave', 'news'],
    popular: true,
    agentRecommended: ['researcher', 'assistant'],
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation — navigate pages, click, fill forms, take screenshots.',
    category: 'web',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    tags: ['browser', 'automation', 'scraping', 'screenshot'],
    agentRecommended: ['tester', 'researcher', 'executor'],
  },

  // ─── DATABASES ──────────────────────────────────────────────────────────
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL databases. Run queries, inspect schemas, analyze data.',
    category: 'databases',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', '{connection_string}'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    tags: ['postgres', 'sql', 'database', 'queries'],
    popular: true,
    agentRecommended: ['backend', 'analyst', 'debugger'],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Read and write SQLite databases. Perfect for local data analysis.',
    category: 'databases',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', '{db_path}'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    tags: ['sqlite', 'sql', 'database', 'local'],
    agentRecommended: ['backend', 'analyst'],
  },

  // ─── CODE & VERSION CONTROL ─────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub integration — repos, issues, PRs, files, search. Full GitHub API access.',
    category: 'code',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    envRequired: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    tags: ['github', 'git', 'repos', 'issues', 'PRs'],
    popular: true,
    agentRecommended: ['coder', 'devops', 'orchestrator'],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'GitLab integration — repositories, MRs, issues, pipelines.',
    category: 'code',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gitlab'],
    envRequired: ['GITLAB_PERSONAL_ACCESS_TOKEN'],
    envOptional: ['GITLAB_API_URL'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab',
    tags: ['gitlab', 'git', 'repos', 'CI/CD'],
    agentRecommended: ['coder', 'devops'],
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Git operations on local repos — log, diff, status, commits, branches.',
    category: 'code',
    command: 'uvx',
    args: ['mcp-server-git', '--repository', '{repo_path}'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    tags: ['git', 'version-control', 'commits', 'diff'],
    agentRecommended: ['coder', 'devops', 'analyst'],
  },

  // ─── CLOUD ──────────────────────────────────────────────────────────────
  {
    id: 'aws-kb',
    name: 'AWS Knowledge Base',
    description: 'Query AWS Bedrock Knowledge Bases for RAG-based information retrieval.',
    category: 'cloud',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws-kb-retrieval-server'],
    envRequired: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/aws-kb-retrieval',
    tags: ['aws', 'bedrock', 'rag', 'knowledge'],
    agentRecommended: ['researcher', 'assistant'],
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Google Maps integration — geocoding, directions, places, distance matrix.',
    category: 'utilities',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    envRequired: ['GOOGLE_MAPS_API_KEY'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps',
    tags: ['maps', 'geocoding', 'directions', 'places'],
    agentRecommended: ['assistant'],
  },

  // ─── COMMUNICATION ──────────────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slack integration — read channels, post messages, search conversations.',
    category: 'communication',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    envRequired: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    tags: ['slack', 'messaging', 'channels', 'notifications'],
    agentRecommended: ['orchestrator', 'assistant'],
  },

  // ─── AI & DATA ──────────────────────────────────────────────────────────
  {
    id: 'everything',
    name: 'Everything (Demo)',
    description: 'Demo MCP server with prompts, resources, and tools for testing the MCP protocol.',
    category: 'utilities',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',
    tags: ['demo', 'testing', 'development'],
    agentRecommended: [],
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Enhances AI reasoning with structured sequential thinking chains and reflection.',
    category: 'ai',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    tags: ['reasoning', 'thinking', 'chain-of-thought', 'planning'],
    popular: true,
    agentRecommended: ['orchestrator', 'architect', 'planner'],
  },

  // ─── UTILITIES ──────────────────────────────────────────────────────────
  {
    id: 'time',
    name: 'Time',
    description: 'Time and timezone utilities. Get current time, convert timezones.',
    category: 'utilities',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-time'],
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    tags: ['time', 'timezone', 'date', 'calendar'],
    agentRecommended: ['assistant', 'planner'],
  },
];

export const CATEGORY_INFO: Record<McpCategory, { label: string; icon: string; description: string }> = {
  files:         { label: 'Files & Storage',     icon: '📁', description: 'File system, storage, and data access' },
  web:           { label: 'Web & Search',         icon: '🌐', description: 'Web browsing, search, and scraping' },
  databases:     { label: 'Databases',            icon: '🗄️', description: 'SQL and NoSQL database connections' },
  code:          { label: 'Code & Version Control', icon: '⚙️', description: 'Git, GitHub, GitLab integration' },
  communication: { label: 'Communication',        icon: '💬', description: 'Slack, email, messaging platforms' },
  cloud:         { label: 'Cloud Services',       icon: '☁️', description: 'AWS, GCP, Azure integrations' },
  ai:            { label: 'AI & Intelligence',    icon: '🧠', description: 'Memory, reasoning, AI enhancement' },
  utilities:     { label: 'Utilities',            icon: '🔧', description: 'Time, maps, and utility tools' },
};

export function searchStore(query: string): McpStoreEntry[] {
  const q = query.toLowerCase();
  return MCP_STORE.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.includes(q)) ||
      e.category.includes(q)
  );
}

export function getStoreEntry(id: string): McpStoreEntry | undefined {
  return MCP_STORE.find((e) => e.id === id);
}

export function getByCategory(category: McpCategory): McpStoreEntry[] {
  return MCP_STORE.filter((e) => e.category === category);
}

export function getPopular(): McpStoreEntry[] {
  return MCP_STORE.filter((e) => e.popular);
}

export function getRecommendedFor(agentName: string): McpStoreEntry[] {
  return MCP_STORE.filter((e) => e.agentRecommended?.includes(agentName));
}
