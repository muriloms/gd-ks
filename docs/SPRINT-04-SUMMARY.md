# Sprint 4 — Concluído ✅

**Release:** `v0.4.0-beta.1` ← primeiro BETA da v0.4!
**Data:** 2026-04-20
**Risco endereçado:** 5.1 — Over-engineering (32 agentes é muito)

---

## 📊 Resultados

| Métrica | Meta | Real | Status |
|---|---|---|---|
| Presets | 7 | **7** | ✅ |
| Testes totais | — | **223** (170 unit + 53 integration) | ✅ |
| Novos Sprint 4 | ~25 | **+26** (+16 unit, +11 integration) | ✅ |
| Cobertura global | ≥ 70% | **93.04%** | ✅ |
| Cobertura `src/core/presets/` | alto | **97.22%** | ✅ |
| Novos schemas | 1 | **1** (preset — 7º schema) | ✅ |
| Novos comandos CLI | 2 | **2** (`preset`, `rollback`) | ✅ |
| Bonus prometido | rollback | **✓ implementado** | ✅ |
| Backward compat | intacto | **Sprint 1+2+3 passam 100%** | ✅ |
| ESLint warnings | 0 | **0** | ✅ |
| Arquivos YAML validados | — | **104** (era 97) | ✅ |

---

## 📁 Arquivos Novos (16)

### Presets (9)
```
src/_config/presets/
├── minimal.preset.yaml
├── solo-indie.preset.yaml
├── small-studio.preset.yaml
├── studio.preset.yaml
├── narrative-heavy.preset.yaml
├── mobile-casual.preset.yaml
└── custom.preset.yaml

tools/validator/schema/
└── preset.schema.json                   (7º schema)

src/core/presets/
└── preset-manager.js                    (119 linhas)
```

### CLI Commands (2)
```
src/cli/commands/
├── preset.js                            (show|list|switch|enable|disable)
└── rollback.js                          (bonus prometido)
```

### Tests (3)
```
tests/unit/
└── preset-manager.test.js               (16 casos)

tests/integration/
├── preset-install.test.js               (6 casos — 1 por preset)
└── rollback-flow.test.js                (5 casos — fluxo completo)
```

### Documentação (2)
```
docs/
├── presets-guide.md                     (guia completo ~9KB)
└── SPRINT-04-SUMMARY.md                 (este documento)
```

---

## 🔄 Arquivos Modificados (7)

| Arquivo | Mudança |
|---|---|
| `package.json` | Bump 0.4.0-alpha.3 → **0.4.0-beta.1** 🎉 |
| `CHANGELOG.md` | Entry completa Sprint 4 |
| `tools/validator/validator.js` | Registra schema `preset` + CLI type |
| `tools/installer/lib/installer.js` | Filtra agentes disabled por preset em `compileAgents()` |
| `src/cli/commands/install.js` | Pergunta de preset no wizard; default solo-indie no `--yes` |
| `src/cli/index.js` | Registra `preset` e `rollback` commands |

---

## 🎯 Demonstração

### 1. Install agora começa perguntando preset

```bash
$ gd-ks install

? 🎮 What is your game project name? MyGame
? 🎯 What best describes your project?
  ❯ Solo Indie (1-2 devs)
    Small Studio (3-10 devs)
    Full Studio (10+ devs, AAA)
    Narrative-Heavy (RPG, VN)
    Mobile Casual / F2P
    Minimal (hobby / game jam)
    Custom (all agents, adjust later)
```

### 2. Agent count por preset

| Preset | Agentes instalados |
|---|---|
| `minimal` | 8 |
| `solo-indie` | 16 |
| `mobile-casual` | 17 |
| `narrative-heavy` | 20 |
| `small-studio` | 23 |
| `studio` / `custom` | 32 |

### 3. Preset show

```bash
$ gd-ks preset show

🎯 Active Preset: 🎮 Solo Indie Developer
   id: solo-indie

Perfect for 1-2 devs building a focused game...

Active Agents (16)
  core:
    ✓ gdks-master
  ideation:
    ✓ concept-brainstormer
    ✓ mechanics-explorer
    ✓ ideation-coordinator
  design:
    ✓ game-design-director
    ✓ mechanics-designer
    ...

Disabled Agents (15)
  · market-analyst
  · level-designer
  · playtest-coordinator
  ...
```

### 4. Rollback (bonus)

```bash
$ gd-ks rollback

🔙 Select checkpoint to restore:
  ❯ phase-02-design-2026-04-20-...-handoff-to-3.yaml
    phase-01-ideation-2026-04-20-...-handoff-to-2.yaml

🔙 Rollback target: phase-01-ideation-2026-04-20-...-handoff-to-2.yaml
   Phase at checkpoint: 1

Summary of change:
  current_phase: 3 → 1
  phases_completed: [1,2] → []

? Restore state from this checkpoint? (y/N) y
  Backup saved: _gdks/_state/checkpoints/phase-03-planning-...-pre-rollback.yaml

✓ Rollback complete.
  New current phase: 1
```

---

## 🔍 Débitos Técnicos

### ✅ Resolvido no Sprint 4
- ~~**Débito 6**~~ (Sprint 2) — Rollback command implementado.

### ⏳ Ainda pendentes
- **Débito 2** — Inconsistência `module.yaml` (ideation objetos, outros strings). Pode ser endereçado no Sprint 5 junto com workflows incompletos.
- **Débito 3** — 9 workflows `core-design/` sem `instructions.md`. Alvo: Sprint 5.
- **Débito 4** — Alguns markdown com múltiplos H1. Ad-hoc.
- **Débito 7** — `autoInjectStateContext: false` — hook automático pós-mutação. Alvo: Sprint 5 ou pós-v1.0.

### 🆕 Descoberto no Sprint 4
- **Débito 8** — Preset schema tem `contracts_relaxed` mas `ContractValidator` ainda não consome. Integração planejada para quando playtest workflows virarem em Sprint 5.

---

## ✅ Checklist do Sprint 4 (do roadmap)

- [x] 7 presets oficiais definidos em YAML e validados
- [x] Installer pergunta sobre preset antes de módulos
- [x] `project-state.yaml` grava `preset` ativo
- [x] `gd-ks preset switch/show/enable-agent/disable-agent` funcionam
- [x] Agentes desabilitados não são compilados (não poluem `_gdks/`)
- [x] Contratos se ajustam ao preset via `required_when` (schema suportado desde Sprint 2)
- [x] Testes: instalação com cada preset gera estrutura correta
- [x] Documentação: `docs/presets-guide.md`
- [x] `gd-ks info` mostra preset atual e agentes ativos *(via `gd-ks preset show`)*
- [x] **Bonus:** `gd-ks rollback` implementado (era planejado pra Sprint 4/5)

---

## 🎉 **BETA MILESTONE**

Esta release (`0.4.0-beta.1`) é o **primeiro beta da linha v0.4**.
Os 4 sprints concluídos endereçaram 4 dos 7 riscos identificados na
análise original:

| Risco | Sprint | Status |
|---|---|---|
| 5.5 — Testes e qualidade | 1 | ✅ |
| 5.2+5.3 — Validação cross-phase + memória | 2 | ✅ |
| 5.7 — Acoplamento a UE5 | 3 | ✅ |
| 5.1 — Over-engineering | 4 | ✅ |
| 5.6 — Curva de aprendizado | 5 | ⏳ |
| 5.4 — Dependência de LLM externo | 6 | ⏳ (opcional, pode ir pra v0.5) |

---

## 🔧 Como Atualizar

### Upgrade de v0.4.0-alpha.3 → beta.1

```bash
cd meu-projeto
npm update gd-ks

# (Opcional) Atribuir preset retroativamente
gd-ks preset switch solo-indie    # ou outro
gd-ks install                      # reaplica filtro
```

### Fresh install

```bash
unzip gd-ks-v0.4.0-beta.1.zip -d gd-ks
cd gd-ks
npm install
npm run lint              # 0 warnings
npm run validate:schemas  # 104 arquivos OK
npm test                  # 223 testes OK
npm run test:coverage     # 93%+
```

---

## ▶️ Próximo Sprint: Sprint 5 — Guided Tutorial

**Escopo:**
- Workflow `*tutorial` no `gdks-master`
- Mini-projeto "Cosmic Explorer" sample
- 9 steps progressivos Ideation→Design→Planning→Engine em ~15 min
- Modo sandbox (não polui `project-state.yaml` real)
- Modo fast (sem pausas)
- Resume after interrupt
- **Bonus candidato:** preencher os 9 `instructions.md` faltantes de core-design

**Duração estimada:** 3-4 dias
**Risco endereçado:** 5.6 — Curva de aprendizado

---

## 🚀 Caminho para v0.4.0 Final

- `0.4.0-beta.1` ← estamos aqui
- `0.4.0-beta.2` após Sprint 5 (tutorial)
- `0.4.0` GA após validação em projeto real do usuário
- `0.5.0-alpha.1` depois, trazendo Sprint 6 (LLM API) se quiser

Se o Sprint 5 ficar rápido e você validar bem o beta, podemos ir
direto para `0.4.0` GA pulando o beta.2 — é sua escolha.
