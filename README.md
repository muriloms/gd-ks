# GD-KS

## Game Development Knowledge System

[![Version](https://img.shields.io/npm/v/gd-ks?color=blue&label=version)](https://www.npmjs.com/package/gd-ks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

**Build Games, Not Documents** — An AI-powered framework for game development with specialized agents that guide you from concept to implementation in Unreal Engine 5.

🎮 **20 Specialized Agents** | 🔄 **64+ Guided Workflows** | 🎯 **Unreal Engine 5 Focus**

---

## ✨ What is GD-KS?

GD-KS (Game Development Knowledge System) is a framework that provides AI agents organized into specialized teams to guide you through the entire game development lifecycle:

```
💡 IDEA → 📋 CONCEPT → 🎮 DESIGN → 📊 PLANNING → ⚙️ IMPLEMENTATION
```

### Four Specialized Teams

| Team | Agents | Purpose |
|------|--------|---------|
| **🧠 Ideation** | Sparky, Marcus, Mira, Ivy | Brainstorming, market analysis, mechanics exploration |
| **🎨 Design** | Diana, Leo, Nina, Theo, Aurora, Anton, Dylan | GDD, level design, narrative, art & audio direction |
| **📋 Planning** | Sam, Tina, Dana, Peter | Sprint planning, epics, stories, roadmap |
| **⚙️ Engine** | Ulysses, Priscilla, Simon, Bella, Eric | UE5 architecture, C++ specs, Blueprint guidance |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v20 or higher
- AI-powered IDE (Cursor, Windsurf, Claude Code, or similar)

### Installation

```bash
npx gd-ks install
```

Follow the interactive prompts to configure your project. The installer will create a `_gdks/` folder with all agents and workflows.

### First Steps

1. **Load an agent** in your IDE (e.g., `@concept-brainstormer`)
2. **Run a workflow** (e.g., `*brainstorm`)
3. **Follow the guided process** to create your game documentation
4. **Progress through teams** from Ideation to Engine

---

## 📁 Project Structure

After installation, your project will have:

```
your-game-project/
├── _gdks/                    # GD-KS installation
│   ├── core/                 # Core system
│   ├── ideation/             # Team 1: Ideation agents
│   ├── design/               # Team 2: Design agents
│   ├── planning/             # Team 3: Planning agents
│   ├── engine/               # Team 4: Engine agents
│   ├── _memory/              # Agent memories
│   └── _config/              # Configuration
│
├── _gdks-output/             # Generated documents
│   ├── 01-ideation/          # Concept briefs, market analysis
│   ├── 02-design/            # GDD, level design, art bible
│   ├── 03-planning/          # Sprints, epics, stories
│   └── 04-engine/            # UE5 specs, implementation guides
│
└── Source/                   # Your Unreal Engine project
```

---

## 🎮 Workflow Overview

### Phase 1: Ideation
```bash
@concept-brainstormer  →  *brainstorm      # Creative ideation
@market-analyst        →  *market-research # Market analysis
@mechanics-explorer    →  *explore-mechanics # Mechanics design
@ideation-coordinator  →  *synthesize-concept # Final concept
```

### Phase 2: Design
```bash
@game-design-director  →  *create-gdd      # Game Design Document
@level-designer        →  *level-doc       # Level documentation
@narrative-designer    →  *narrative-doc   # Story and characters
@art-director          →  *art-bible       # Visual direction
@audio-director        →  *audio-bible     # Audio direction
```

### Phase 3: Planning
```bash
@scrum-master          →  *create-epics    # Create epics from GDD
@scrum-master          →  *sprint-planning # Plan sprints
@technical-producer    →  *roadmap         # Development roadmap
```

### Phase 4: Engine
```bash
@ue5-architect         →  *ue5-architecture # UE5 architecture
@ue5-programmer-lead   →  *code-prompt     # Generate LLM prompts
@ue5-systems-specialist →  *gas-implementation # GAS setup
```

---

## 🎯 Key Features

### 🤖 Specialized AI Agents
Each agent has a unique personality, expertise, and set of workflows tailored to their role in game development.

### 📝 Structured Documentation
Generate professional game development documents: GDD, Technical Design, Art Bible, Audio Bible, and more.

### 🔄 Guided Workflows
Step-by-step processes that ensure you don't miss important details.

### 🎮 Unreal Engine 5 Focus
Deep knowledge of UE5 architecture, GAS, Enhanced Input, and best practices.

### 💻 LLM Code Generation
Generate prompts that you can use with any LLM to create implementation code.

### 📊 Sprint Management
Organize work into epics, stories, and sprints with proper tracking.

---

## 📚 Documentation

- [Getting Started Tutorial](docs/tutorials/getting-started.md)
- [Agent Reference](docs/reference/agents/)
- [Workflow Reference](docs/reference/workflows/)
- [Configuration Guide](docs/how-to/configuration.md)

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Inspired by [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) - the Breakthrough Method of Agile AI-Driven Development.

---

<p align="center">
  <strong>GD-KS</strong> — Build Games, Not Documents
</p>
