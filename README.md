# 🎮 GD-KS (Game Development Knowledge System)

[![npm version](https://img.shields.io/npm/v/gd-ks.svg)](https://www.npmjs.com/package/gd-ks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gd-ks.svg)](https://nodejs.org)

**AI-powered framework for game development with Unreal Engine 5**

GD-KS provides 21 specialized AI agents organized into 4 teams to guide you through the entire game development lifecycle - from initial brainstorming to implementation-ready specifications.

## ✨ Features

- 🧠 **21 Specialized AI Agents** - Each with unique expertise and personality
- 🎯 **4 Development Teams** - Ideation, Design, Planning, Engine
- 📋 **Guided Workflows** - Step-by-step processes for each task
- 🎮 **UE5 Focused** - Tailored for Unreal Engine 5 development
- 🖥️ **Multi-IDE Support** - Cursor, Windsurf, VS Code, Claude Code

## 🚀 Quick Start

```bash
# Create a new game project folder
mkdir my-game && cd my-game

# Install GD-KS
npx gd-ks install

# Follow the wizard to configure your project
```

## 📦 Teams & Agents

### 🧠 Ideation Team (Phase 1)
| Agent | Role | Specialty |
|-------|------|-----------|
| **Sparky** 💡 | Concept Brainstormer | Creative ideation, hooks, core fantasy |
| **Marcus** 📊 | Market Analyst | Market research, competitors, positioning |
| **Mira** ⚙️ | Mechanics Explorer | Core loops, systems design, game feel |
| **Ivy** 🎯 | Coordinator | Synthesis, validation, handoff |

### 🎨 Design Team (Phase 2)
| Agent | Role | Specialty |
|-------|------|-----------|
| **Diana** 🎨 | Game Design Director | GDD creation, systems design |
| **Leo** 🗺️ | Level Designer | Level layouts, encounters, pacing |
| **Nina** 📖 | Narrative Designer | Story, characters, dialogue |
| **Theo** 🔧 | Technical Designer | Data specs, formulas, balance |
| **Aurora** 🎨 | Art Director | Visual style, color, aesthetics |
| **Anton** 🎵 | Audio Director | Music, SFX, audio design |
| **Dylan** 📋 | Coordinator | Review, consistency, handoff |

### 📊 Planning Team (Phase 3)
| Agent | Role | Specialty |
|-------|------|-----------|
| **Sam** 📊 | Scrum Master | Sprint planning, stories, ceremonies |
| **Tina** 📅 | Technical Producer | Roadmap, milestones, risks |
| **Dana** 📝 | Documentation Specialist | Templates, standards, DoD |
| **Peter** 🎯 | Coordinator | Validation, handoff |

### 🏗️ Engine Team (Phase 4)
| Agent | Role | Specialty |
|-------|------|-----------|
| **Ulysses** 🏗️ | UE5 Architect | System architecture, class hierarchy |
| **Priscilla** 💻 | Programmer Lead | C++ specifications, implementation |
| **Simon** ⚙️ | Systems Specialist | GAS, AI, save/load, input |
| **Bella** 📐 | Blueprint Specialist | BP architecture, widgets, AnimBP |
| **Eric** 🎯 | Coordinator | Review, tech specs, LLM prompts |

## 🎯 Commands

Once installed, use these commands in your AI chat:

| Command | Description |
|---------|-------------|
| `*help` | Show available commands |
| `*init` | Initialize project and select track |
| `*status` | Check workflow progress |
| `*teams` | View all teams and agents |
| `*party` | Multi-agent collaboration mode |

## 📁 Project Structure

After installation:

```
your-project/
├── _gdks/                    # GD-KS system files
│   ├── core/                 # Core module
│   │   ├── agents/          # Master agent
│   │   └── workflows/       # Core workflows
│   ├── ideation/            # Ideation team
│   ├── design/              # Design team
│   ├── planning/            # Planning team
│   ├── engine/              # Engine team
│   ├── _config/             # Configuration
│   └── _memory/             # Agent memory
├── _gdks-output/             # Generated documents
│   ├── 01-ideation/
│   ├── 02-design/
│   ├── 03-planning/
│   └── 04-engine/
└── .cursor/rules/gdks/       # IDE rules (if Cursor)
```

## 🖥️ IDE Support

GD-KS supports multiple IDEs:

- **Cursor** (recommended) - Auto-applies rules based on file context
- **Windsurf** - Rules file for AI context
- **VS Code** - Works with Copilot, Continue, etc.
- **Claude Code** - Command files for slash commands

## 🔄 Development Tracks

Choose your development pace:

| Track | Phases | Duration | Best For |
|-------|--------|----------|----------|
| **Quick** | Ideation → Engine | 1-2 weeks | Game jams, prototypes |
| **Standard** | Ideation → Design → Engine | 2-4 weeks | Small projects |
| **Full** | All 4 phases | 4-8 weeks | Complete productions |

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Inspired by the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) framework.

---

**Made with ❤️ for indie game developers**

[Report Bug](https://github.com/mrlmoro/gd-ks/issues) · [Request Feature](https://github.com/mrlmoro/gd-ks/issues)
