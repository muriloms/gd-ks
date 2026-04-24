# Multi-Engine Expansion — Concluída ✅

**Release:** `v0.4.0-beta.2` (revised)
**Data:** 2026-04-23
**Objetivo:** adicionar suporte first-class a Godot 4 e Unity 6 ao
lado de Unreal Engine 5, mantendo a versão `0.4.0-beta.2`.

---

## 📊 Resultados

| Métrica | Antes | Depois | Status |
|---|---|---|---|
| Engines suportadas | 1 (UE5) | **3** (UE5, Godot 4, Unity 6) | ✅ |
| Agentes de engine | 5 | **13** (5 UE5 + 4 Godot + 4 Unity) | ✅ |
| Workflows de engine | 4 | **10** (4 UE5 + 3 Godot + 3 Unity) | ✅ |
| Engine profiles | 1 | **3** | ✅ |
| Testes totais | 231 | **240** (+9 novos) | ✅ |
| YAML arquivos validados | 105 | **123** | ✅ |
| ESLint warnings | 0 | **0** | ✅ |

---

## 📁 Arquivos Novos (21)

### Godot 4 Engine (9)
```
src/modules/engines/godot-4/
├── engine-profile.yaml
├── module.yaml
├── agents/
│   ├── godot-architect.agent.yaml           (Guilherme)
│   ├── godot-gdscript-lead.agent.yaml       (Gabi)
│   ├── godot-node-specialist.agent.yaml     (Gina)
│   └── engine-coordinator-godot.agent.yaml  (Érico)
└── workflows/
    ├── godot-architecture/workflow.yaml
    ├── scene-specs/workflow.yaml
    └── code-prompt-godot/workflow.yaml
```

### Unity 6 Engine (9)
```
src/modules/engines/unity-6/
├── engine-profile.yaml
├── module.yaml
├── agents/
│   ├── unity-architect.agent.yaml           (Uma)
│   ├── unity-csharp-lead.agent.yaml         (Ugo)
│   ├── unity-prefab-specialist.agent.yaml   (Uli)
│   └── engine-coordinator-unity.agent.yaml  (Enzo)
└── workflows/
    ├── unity-architecture/workflow.yaml
    ├── prefab-specs/workflow.yaml
    └── code-prompt-unity/workflow.yaml
```

### Tests (1)
```
tests/integration/
└── multi-engine-install.test.js             (5 casos)
```

### Docs (1)
```
docs/
└── MULTI-ENGINE-EXPANSION-SUMMARY.md        (este)
```

### Sample removidos (2)
```
src/modules/engines/godot-4/.placeholder   ❌ (substituído por engine-profile.yaml real)
src/modules/engines/unity-6/.placeholder   ❌
```

---

## 🔄 Arquivos Modificados (7)

| Arquivo | Mudança |
|---|---|
| `tools/installer/lib/module-manager.js` | `godot-4` e `unity-6` agora `available: true` |
| `src/cli/commands/install.js` | Picker offerece os três engines como "fully supported" |
| `tools/installer/lib/installer.js` | `_prunePresetDisabledAgents` resolve preset UE5-centric para o target engine |
| `src/modules/planning/templates/story.template.md` | Blocos `{{#engine godot-4}}` e `{{#engine unity-6}}` expandidos com conteúdo idiomático |
| `CHANGELOG.md` | Entry atualizada |
| `tests/unit/engine-profile-manager.test.js` | Testes atualizados (antes assumiam placeholders) |
| `tests/unit/module-manager.test.js` | `getAvailableEngines` agora espera todas 3 |
| `tests/integration/engine-agnostic.test.js` | Teste de placeholder substituído por teste de full modules |

---

## 🎯 Demonstração

### 1. Installer oferece os três engines

```bash
$ gd-ks install

? 🎮 Which game engine will you use?
  ❯ Unreal Engine 5 (fully supported)
    Godot 4 (fully supported)
    Unity 6 (fully supported)
    Engine-agnostic (design & planning only)
```

### 2. Install com Godot

```bash
$ gd-ks install --yes   # (com targetEngine: godot-4 configurado)

# Resultado em _gdks/engine/agents/:
  engine-coordinator-godot.agent.yaml  +.md
  godot-architect.agent.yaml           +.md
  godot-gdscript-lead.agent.yaml       +.md
  godot-node-specialist.agent.yaml     +.md

# project-state.yaml:
  target_engine: godot-4
```

### 3. Install com Unity

```bash
$ gd-ks install --yes   # (com targetEngine: unity-6)

# Resultado em _gdks/engine/agents/:
  engine-coordinator-unity.agent.yaml  +.md
  unity-architect.agent.yaml           +.md
  unity-csharp-lead.agent.yaml         +.md
  unity-prefab-specialist.agent.yaml   +.md

# project-state.yaml:
  target_engine: unity-6
```

### 4. Story template rende o bloco certo

Para um story com template conditional, rendering do block correto:

**Godot:**
```markdown
### Godot 4 Implementation

- Implement core logic in GDScript with **static typing** (`var speed: float = 100.0`)
- Expose designer tunables with `@export` annotations
- Use signals (`signal name(arg: Type)`) for loose coupling between nodes
- Use `_physics_process(delta)` for physics-bound logic
...
```

**Unity:**
```markdown
### Unity 6 Implementation

- Implement core logic as a `MonoBehaviour` component (or `ScriptableObject` for data)
- Expose tunables with `[SerializeField] private` fields, grouped with `[Header]`
- Cache `GetComponent<T>()` calls in `Awake()` — never in `Update()`
...
```

---

## 🧠 Decisões Técnicas

### 1. Por que 4 agentes por engine?

Espelha a estrutura UE5 (5 agentes):
- Architect — design do sistema
- Language Lead — escreve specs da linguagem primária
- Composition Specialist — Blueprint/Scene/Prefab
- Coordinator — integração e checklist

Omiti o "Systems Specialist" para Godot/Unity porque no UE5 ele trata de GAS/Subsystems (coisas UE5-específicas). Em Godot/Unity, arquitetura de sistemas fica com o Architect.

### 2. Por que não fiz migração entre engines?

Trocar de engine meio-projeto requer:
- Regenerar templates de story
- Substituir agentes compilados
- Manter decisions/state intactos
- Possivelmente limpar contracts

É um fluxo complexo e de caso de uso reduzido. Deixei planejado para v0.5 junto com outras features de "engine switching".

### 3. Por que manter presets com agents UE5 hardcoded?

Alternativa seria reescrever os 7 presets para listar agents genericamente. Isso seria:
- 7 × 3 = 21 permutações se cada preset tivesse variante por engine
- Ou um sistema mais abstrato de "papéis" (ex: "language-lead") mapeados para agents concretos

Optei por solução pragmática: o installer detecta menções a `ue5-*` em `agents_active` e substitui pelo `agents_provided` do target engine. Funciona hoje, pode ser refatorado quando a abstração começar a pagar o custo.

### 4. Cross-engine isolation

O novo test `multi-engine-install.test.js` garante que:
- Instalar UE5 não traz agents Godot/Unity (via `dependencies` em `module.yaml`)
- Instalar Godot não traz agents UE5/Unity
- Instalar Unity não traz agents UE5/Godot

Isolation é mandatória — agents de engines errados confundiriam o usuário.

---

## ✅ Checklist

- [x] Godot 4: 4 agents + 3 workflows + engine-profile + module.yaml
- [x] Unity 6: 4 agents + 3 workflows + engine-profile + module.yaml
- [x] Todos os YAMLs passam no schema validator (123 files OK)
- [x] Installer wizard oferece os três engines sem "coming soon"
- [x] `ModuleManager.KNOWN_ENGINES` marca os três como available
- [x] `_prunePresetDisabledAgents` faz resolução engine-aware
- [x] Template `story.template.md` tem blocos idiomáticos
- [x] Install com `targetEngine: godot-4` funciona (verificado)
- [x] Install com `targetEngine: unity-6` funciona (verificado)
- [x] Testes existentes atualizados (placeholders → full modules)
- [x] 5 novos integration tests para multi-engine
- [x] 4 novos unit tests para Godot/Unity profiles
- [x] Suite passa: 240/240 testes
- [x] Lint: 0 warnings
- [x] CHANGELOG atualizado
- [x] `docs/adding-new-engine.md` ainda é válido (exemplos de Godot/Unity só reforçam)

---

## 🚀 Impacto no Roadmap

Antes da expansão, Godot 4 e Unity 6 estavam planejados para **v0.5.0**.
Com a entrega antecipada na `0.4.0-beta.2`:

| Antes | Depois |
|---|---|
| v0.4.0: UE5 only | v0.4.0: UE5 + Godot 4 + Unity 6 |
| v0.5.0 Sprint 7: Godot | v0.5.0 pode focar em LLM integration, engine-switching, ou outros |
| v0.6.0 Sprint 8: Unity | Disponível mais cedo |

A v0.4.0 agora é uma release de **"full game dev framework"** e não apenas um "UE5 assistant".

---

## 🔧 Como Testar

```bash
unzip gd-ks-v0.4.0-beta.2.zip -d gd-ks
cd gd-ks
npm install
npm run lint              # 0 warnings
npm run validate:schemas  # 123 files OK
npm test                  # 240 tests OK

# Testar install com engines diferentes
mkdir -p /tmp/test-{ue5,godot,unity}

# Godot
cd /tmp/test-godot
node /path/to/gd-ks/bin/gd-ks.js install  # escolher godot-4

# Unity
cd /tmp/test-unity
node /path/to/gd-ks/bin/gd-ks.js install  # escolher unity-6
```
