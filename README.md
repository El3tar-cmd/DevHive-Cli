# ⬡ DevHive CLI

**DevHive CLI** is a terminal-based **Multi-Agent AI Engineering Platform** for intelligent and autonomous workflows. It allows developers to seamlessly interact with multiple AI agents (Architects, Coders, Debuggers, Orchestrators) inside their terminal leveraging local and cloud models (via Ollama or supported APIs) to brainstorm, debug, and write code securely.

---

## ⚡ Features

- **Multi-Agent Architecture**: 15+ specialized AI agents, including `orchestrator`, `frontend`, `backend`, `security`, `debugger`, `planner`, and `coder`.
- **Dynamic Command Palette**: A robust UI featuring autocomplete slash commands (e.g. `/agent`, `/model list`, `/skills`) to easily navigate the tool without leaving your keyboard.
- **MCP Integration (Model Context Protocol)**: Store and index knowledge, recommend tools, and interact seamlessly with advanced servers.
- **Skill Engine**: Dynamically load and inject skills into the AI agents' contexts, giving them contextual superpowers.
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

3. **Build the CLI:**
   ```bash
   npm run build
   ```

4. **Link the CLI globally (Optional but recommended):**
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
| `/model set <name>` | Switch the active AI model (e.g. `llama3.2`) |
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
- **`src/agents/`**: Core definitions and runtime runners for the multi-agent system.
- **`src/providers/`**: AI model connections (Ollama streaming proxy, payload parsers).
- **`src/mcp/`**: Handling interactions with MCP clients and tool calling protocols. 

---

## 📄 License

This project is licensed under the MIT License - feel free to customize and expand DevHive.

---
*Created by [El3tar-cmd](https://github.com/El3tar-cmd).*
