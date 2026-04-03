# ⬡ DevHive CLI

**DevHive CLI** is a terminal-based **Multi-Agent AI Engineering Platform** for intelligent and autonomous workflows. It allows developers to seamlessly interact with multiple AI agents (Architects, Coders, Debuggers, Orchestrators) inside their terminal leveraging local and cloud models (via Ollama or supported APIs) to brainstorm, debug, and write code securely.

---

## ⚡ What's New (Latest Updates)

- **Advanced Recursive Agent Loader**: DevHive can now automatically crawl and load over 100+ nested agents and skill folders (supporting structures like `agents/skill-name/SKILL.md`).
- **Heavy LLM Optimizations**: Injected `CRITICAL RULES FOR AI` to strictly enforce tool calls and autonomous execution. This ensures massive reasoning models (like `minimax`, `qwen2.5-coder`, and 800b parameters) execute code rapidly without hallucinating, freezing, or stopping mid-task.
- **Smart `edit_file` Tool**: Replaced legacy heavy file-rewriting with precise line-level string replacement, significantly saving context window tokens and drastically speeding up modifications.
- **Import Scripts**: Bundled `import-agents.js` to easily migrate your third-party isolated skills or agents directly into the DevHive core.
- **UI/UX Polish**: Upgraded the CLI visual display with stunning, 53-character beautifully aligned Gold ASCII layouts for an immersive dashboard feel.

---

## 🔥 Features

- **Multi-Agent Architecture**: Comes equipped to handle a massive matrix of custom AI agents. `orchestrator`, `frontend`, `backend`, `security`, and heavily tailored workflows.
- **Dynamic Command Palette**: A robust UI featuring autocomplete slash commands (e.g. `/agent`, `/model`, `/skills`) to easily navigate the tool without leaving your keyboard.
- **MCP Integration (Model Context Protocol)**: Store and index knowledge, recommend tools, and interact seamlessly with advanced servers.
- **Provider Agnostic**: Works perfectly with local **Ollama** models or any other AI backend connected to the interface.
- **Smart Terminal Environment**: Agent context automatically captures your working directory, date, and local environment references.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16.14 or higher is recommended)
- [Git](https://git-scm.com/)
- [Ollama](https://ollama.com/) (if you plan to use local AI models securely)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/El3tar-cmd/DevHive-Cli.git
   cd DevHive-Cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Migrate/Bundle your Custom Agents (Optional):**
   ```bash
   node import-agents.js
   ```

4. **Build the CLI:**
   ```bash
   npm run build
   ```

5. **Link the CLI globally (Optional but recommended):**
   ```bash
   npm link
   ```

---

## 🛠️ Usage

If you used `npm link`, you can simply run DevHive anywhere using:

```bash
hive
```

*(Alternatively, run it via `npm run start` or `node dist/index.js`)*

### Interactive Commands

DevHive CLI comes with a rich set of built-in commands. You can access the command palette securely at any prompt by typing `/`.

| Command | Description |
| :--- | :--- |
| `/model list` | View all available models |
| `/model set <name>` | Switch the active AI model (e.g. `minimax-m2.7`) |
| `/agent` | Let the system auto-assign the best specialized agent |
| `/agent <name>` | Explicitly switch to an agent (e.g. `/agent coder`) |
| `/skills` | Manage, inject, and load special system skills |
| `/mcp` | Interact with the Model Context Protocol engine |
| `/session` | Manage your active context and chat histories |
| `/clear` | Clear the current screen and terminal buffer |
| `/exit` | Exit DevHive |

---

## 🏗️ Project Architecture

DevHive consists of several key modules:
- **`src/ui/`**: Advanced terminal handling, colored output elements, display widgets, and interactive command palettes.
- **`src/agents/`**: Core definitions, smart caching loaders, and runtime runners handling critical multi-agent tool loops.
- **`src/tools/`**: Powerful operational tools (Shell execution, Fetch, Directory Mgmt, Fast File Editor).
- **`src/providers/`**: AI model connections (Ollama streaming proxy, payload parsers).
- **`src/mcp/`**: Handling interactions with MCP clients and tool calling protocols. 

---

## 👤 Author

**Abdalrahman Mahmoud**
- **Email:** abdalrhamn.mahmoud@gmail.com
- **Profile:** [Facebook](https://www.facebook.com/share/1CMHZog6hZ/)
- **Company:** [DevHive Agency](https://www.facebook.com/share/1bvbFW6T99/)

## 📄 License

This project is licensed under the MIT License - feel free to customize and expand DevHive.
