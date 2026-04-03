import { Provider } from './types';
import { OllamaProvider } from './ollama';
import { getConfig } from '../config';

export function getProvider(): Provider {
  const config = getConfig();
  return new OllamaProvider(config.ollamaUrl);
}

export { OllamaProvider };
export * from './types';
