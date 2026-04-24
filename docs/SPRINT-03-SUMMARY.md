# Sprint 3 — Concluído ✅

**Release:** `v0.4.0-alpha.3`
**Data:** 2026-04-20
**Risco endereçado:** 5.7 — Acoplamento a UE5

---

## 📊 Resultados

| Métrica | Meta | Real | Status |
|---|---|---|---|
| Testes totais | — | **197** (155 unit + 42 integration) | ✅ |
| Novos testes Sprint 3 | ~25 | **+32** (+26 unit, +6 integration) | ✅ |
| Cobertura global | ≥ 70% | **93.08%** | ✅ |
| Cobertura `src/core/engines/` | alto | **93.2%** | ✅ |
| Cobertura `src/core/templates/` | alto | **94.7%** | ✅ |
| Novos schemas JSON | 1 | **1** (engine-profile) | ✅ |
| Novos comandos CLI | 1 | **1** (`state inject`) | ✅ |
| Referências UE5 neutralizadas | todas | **2/2** (planning-coord + audio) | ✅ |
| Backward compat | intacto | **Sprint 1+2 passam 100%** | ✅ |
| ESLint warnings | 0 | **0** | ✅ |
| Arquivos YAML validados | — | **97** (era 93) | ✅ |

---

## 🏗️ Reorganização Arquitetural

### Antes (v0.4.0-alpha.2)
```
src/modules/
├── ideation/
├── design/
├── planning/
└── engine/              ← UE5 hardcoded
    ├── agents/
    └── workflows/
```

### Depois (v0.4.0-alpha.3)
```
src/modules/
├── ideation/           (engine-agnostic)
├── design/             (engine-agnostic)
├── planning/           (engine-agnostic)
└── engines/
    ├── _shared/
    │   └── engine-interface.yaml       ← contrato doc
    ├── unreal-5/
    │   ├── engine-profile.yaml         ← NOVO
    │   ├── module.yaml
    │   ├── agents/ (5)
    │   └── workflows/ (4)
    ├── godot-4/
    │   └── .placeholder                (v0.5)
    └── unity-6/
        └── .placeholder                (v0.5)
```

**Sem symlinks, sem breaking changes.** O `ModuleManager` resolve o
nome legacy `engine` para `engines/<targetEngine>/` programaticamente.

---

## 📁 Arquivos Novos (13)

### Engine subsystem
```
src/core/engines/
└── engine-profile-manager.js     (92 linhas — load/validate/cache)

src/core/templates/
└── template-conditionals.js      (78 linhas — {{#engine}} renderer)

src/modules/engines/_shared/
└── engine-interface.yaml          (contrato doc)

src/modules/engines/unreal-5/
└── engine-profile.yaml            (perfil UE5 completo)

src/modules/engines/{godot-4,unity-6}/
└── .placeholder                   (futuro v0.5)
```

### Schemas
```
tools/validator/schema/
└── engine-profile.schema.json     (novo — 6º schema)
```

### Templates
```
src/modules/planning/templates/
└── story.template.md              (exemplo com {{#engine}} blocks)
```

### Config
```
src/_config/
└── features.yaml                  (feature flags)
```

### Tests (3)
```
tests/unit/
├── engine-profile-manager.test.js    (18 casos)
└── template-conditionals.test.js     (8 casos)

tests/integration/
└── engine-agnostic.test.js           (6 casos)
```

### Documentação (2)
```
docs/
├── adding-new-engine.md           (guia passo-a-passo ~12KB)
└── SPRINT-03-SUMMARY.md           (este documento)
```

---

## 🔄 Arquivos Modificados (7)

| Arquivo | Mudança |
|---|---|
| `package.json` | Bump 0.4.0-alpha.2 → 0.4.0-alpha.3 |
| `CHANGELOG.md` | Entry completa Sprint 3 |
| `tools/installer/lib/module-manager.js` | Resolução de `engine` → `engines/<id>`; export de `KNOWN_ENGINES` e `getAvailableEngines()` |
| `tools/installer/lib/installer.js` | Aceita `targetEngine`; passa ao ModuleManager |
| `tools/installer/lib/agent-compiler.js` | Emite placeholder `<!-- GDKS_STATE_CONTEXT_PLACEHOLDER -->` |
| `tools/validator/validator.js` | Carrega schema `engine-profile` |
| `src/cli/commands/install.js` | Pergunta de engine no wizard |
| `src/cli/commands/state.js` | Novo subcomando `inject` |
| `src/modules/planning/agents/planning-coordinator.agent.yaml` | Neutralização UE5 |
| `src/modules/design/workflows/audio/audio-implementation/workflow.yaml` | Neutralização UE5 |

---

## 🎯 Demonstração

### 1. Install agora pergunta engine

```bash
$ gd-ks install

? 🎮 Which game engine will you use?
  ❯ Unreal Engine 5 (fully supported)
    Godot 4 (planned for v0.5)             [disabled]
    Unity 6 (planned for v0.5)             [disabled]
    Engine-agnostic (design & planning only)
```

### 2. `project-state.yaml` grava a engine

```yaml
schema_version: "1.0"
project:
  id: "my-game"
  name: "My Game"
preset: "solo-indie"
target_engine: "unreal-5"     ← persistido
```

### 3. Templates podem se adaptar à engine

```markdown
{{#engine unreal-5}}
Implement as a `UCharacterMovementComponent` subclass.
Expose tunables via `UPROPERTY(EditAnywhere, BlueprintReadWrite)`.
{{/engine}}

{{#engine godot-4}}
Implement as GDScript extending `CharacterBody2D`.
Expose tunables via `@export`.
{{/engine}}
```

Renderizado com `template-conditionals.js`, o bloco errado é removido
e as linhas em branco colapsadas automaticamente.

### 4. Agentes têm placeholder de state context

Todo `.md` compilado agora começa com:

```markdown
# Ulysses

> UE5 Architect 🏗️

<!-- GDKS_STATE_CONTEXT_PLACEHOLDER -->
> ℹ️ Current project state will be injected here...

<agent_identity>
...
```

Rodar `gd-ks state inject` substitui o placeholder pelo contexto real:

```
✓ Injected project state context into 10 compiled agent(s).
```

---

## 🔍 Débitos Técnicos

### ✅ Resolvido no Sprint 3
- ~~**Débito 5**~~ (do Sprint 2) — placeholder de state context no agent compiler + comando `gd-ks state inject` funcionando.

### ⏳ Ainda pendentes
- **Débito 2** — Inconsistência nos `module.yaml` (ideation usa objetos, outros usam strings). Continua de Sprint 1; pode ser resolvido em Sprint 4 quando tivermos presets normalizando tudo.
- **Débito 3** — 9 dos 11 workflows `core-design/` sem `instructions.md`. Alvo: Sprint 5.
- **Débito 4** — 6 arquivos Markdown com múltiplos H1. Ad-hoc.
- **Débito 6** (Sprint 2) — Não há comando `gd-ks rollback`. Alvo: Sprint 4.

### 🆕 Descoberto no Sprint 3
- **Débito 7** — `autoInjectStateContext` no `features.yaml` está `enabled: false`. O ideal é rodar `state inject` automaticamente depois de toda mutação de state — precisa de um hook no state-manager. Alvo: Sprint 4 ou 5.

---

## ✅ Checklist do Sprint 3 (do roadmap)

- [x] Módulo `engines/unreal-5/` criado a partir do `engine/` atual sem perda
- [x] `engine-interface.yaml` (contrato) definido e validado
- [x] `engine-profile.yaml` do UE5 criado e completo
- [x] Design e Planning grep'd por "UE5", "Unreal", "Blueprint", "C++" — todos tratados
- [x] Placeholders de `godot-4/` e `unity-6/` criados com estrutura mínima
- [x] Pergunta de engine no installer funciona
- [x] `project-state.yaml` registra `target_engine`
- [x] Template do Planning usa `{{#engine}}` blocks
- [x] Documentação: `docs/adding-new-engine.md` (guia para contribuidores)
- [x] Todos os testes da v0.3 continuam passando (backward compat)
- [x] **Bonus:** `gd-ks state inject` injeta contexto nos agentes compilados

---

## 🔧 Como Atualizar

### Fresh install
```bash
unzip gd-ks-v0.4.0-alpha.3.zip -d gd-ks
cd gd-ks
npm install
npm run lint              # zero warnings
npm run validate:schemas  # 97 arquivos OK
npm test                  # 197 testes OK
npm run test:coverage     # 93%+
```

### Upgrade de v0.4.0-alpha.2 → alpha.3
Sem ação especial necessária. Basta:
```bash
cd meu-projeto
npm update gd-ks
gd-ks state inject   # (opcional) injetar contexto atual nos agentes compilados
```

### Upgrade de v0.3 → v0.4.0-alpha.3
Rodar script de migração (inalterado desde alpha.2):
```bash
node node_modules/gd-ks/scripts/migrate-v03-to-v04.js --apply
```

---

## ▶️ Próximo Sprint: Sprint 4 — Presets & Profiles

**Escopo:**
- 7 presets oficiais: `minimal`, `solo-indie`, `small-studio`, `studio`, `narrative-heavy`, `mobile-casual`, `custom`
- Pergunta de preset no installer (antes de módulos)
- `gd-ks preset switch|show|enable-agent|disable-agent`
- Contratos ajustam `required_deliverables` conforme preset
- Agentes desabilitados não são compilados (não poluem `_gdks/`)
- **Bonus:** comando `gd-ks rollback` (rollback de checkpoint)

**Duração estimada:** 5 dias
**Risco endereçado:** 5.1 — Over-engineering (32 agentes é muito)
