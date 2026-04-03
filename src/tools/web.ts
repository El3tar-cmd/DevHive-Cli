import { Tool } from './types';

export const webFetchTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Fetch content from a URL. Use for documentation, APIs, web pages, or any public resource.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
          extract: {
            type: 'string',
            description: 'What to return: text (default), raw, or links',
            enum: ['text', 'raw', 'links'],
          },
        },
        required: ['url'],
      },
    },
  },
  async execute(args) {
    try {
      const res = await fetch(args.url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Devy-CLI/1.0', Accept: 'text/html,application/json,text/plain,*/*' },
      });
      if (!res.ok) return `❌ HTTP ${res.status}: ${res.statusText}`;

      const contentType = res.headers.get('content-type') || '';
      let text = await res.text();

      if (args.extract === 'raw') return text.slice(0, 10000);

      if (args.extract === 'links') {
        const links = [...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).slice(0, 50);
        return links.join('\n') || 'No links found';
      }

      if (contentType.includes('text/html')) {
        text = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
      return text.length > 10000 ? text.slice(0, 10000) + '\n...[truncated]' : text;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return `❌ Fetch failed: ${error.message || String(err)}`;
    }
  },
};
