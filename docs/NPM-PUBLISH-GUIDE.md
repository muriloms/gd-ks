# 📦 GD-KS - Guia de Publicação NPM

Este documento contém instruções passo-a-passo para publicar o GD-KS no NPM.

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **Conta NPM** (gratuita em https://www.npmjs.com/signup)
3. **Repositório GitHub** criado

---

## 🚀 Passo 1: Configurar Conta NPM

### 1.1 Criar conta (se não tiver)
```bash
# Acesse https://www.npmjs.com/signup e crie sua conta
```

### 1.2 Login no terminal
```bash
npm login
# Digite seu username, password, email e OTP (se tiver 2FA)
```

### 1.3 Verificar login
```bash
npm whoami
# Deve mostrar: mrlmoro (ou seu username)
```

---

## 📁 Passo 2: Preparar o Repositório GitHub

### 2.1 Criar repositório
- Acesse https://github.com/new
- Nome: `gd-ks`
- Descrição: `Game Development Knowledge System - AI-powered framework for game development`
- Público
- NÃO inicialize com README (já temos)

### 2.2 Conectar e fazer push
```bash
cd gd-ks

# Inicializar git (se ainda não fez)
git init

# Adicionar remote
git remote add origin https://github.com/muriloms/gd-ks.git

# Criar branch main
git branch -M main

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "feat: initial release v0.1.0-alpha.1

- 21 specialized AI agents across 4 teams
- Interactive installation wizard
- Multi-IDE support (Cursor, Windsurf, VS Code, Claude Code)
- Workflow system with templates
- UE5 focused development guidance"

# Push
git push -u origin main
```

---

## ✅ Passo 3: Verificar Pacote

### 3.1 Verificar o que será publicado
```bash
npm pack --dry-run
```

Isso mostra todos os arquivos que serão incluídos. Deve mostrar:
- `bin/gd-ks.js`
- `src/**/*`
- `tools/**/*`
- `README.md`
- `LICENSE`
- `CHANGELOG.md`

### 3.2 Testar instalação local
```bash
# Em outra pasta
mkdir /tmp/teste-npm && cd /tmp/teste-npm
npm install /caminho/para/gd-ks

# Testar comando
npx gd-ks --version
npx gd-ks info
```

---

## 🎯 Passo 4: Publicar no NPM

### 4.1 Publicar versão alpha (tag: alpha)
```bash
cd gd-ks

# Publicar com tag alpha
npm publish --tag alpha --access public
```

> **Nota:** O `--tag alpha` faz com que `npm install gd-ks` NÃO instale esta versão por padrão. Usuários precisam usar `npm install gd-ks@alpha`.

### 4.2 Verificar publicação
```bash
# Ver no NPM
npm view gd-ks

# Ou acesse: https://www.npmjs.com/package/gd-ks
```

---

## 🧪 Passo 5: Testar Instalação via NPM

```bash
# Criar pasta de teste
mkdir ~/teste-gd-ks && cd ~/teste-gd-ks

# Instalar via npx (sem instalar globalmente)
npx gd-ks@alpha install

# Ou instalar globalmente
npm install -g gd-ks@alpha
gd-ks install
```

---

## 📈 Passo 6: Promover para Latest (quando estável)

Quando a versão estiver estável:

```bash
# Opção 1: Publicar nova versão como latest
npm version minor  # 0.1.0-alpha.1 -> 0.2.0
npm publish

# Opção 2: Promover tag existente
npm dist-tag add gd-ks@0.1.0-alpha.1 latest
```

---

## 🔄 Atualizações Futuras

### Bump de versão
```bash
# Patch (bug fixes): 0.1.0 -> 0.1.1
npm version patch

# Minor (new features): 0.1.0 -> 0.2.0
npm version minor

# Major (breaking changes): 0.1.0 -> 1.0.0
npm version major

# Alpha específico
npm version prerelease --preid=alpha
```

### Publicar atualização
```bash
npm publish --tag alpha  # para alpha
npm publish              # para latest
```

---

## ⚠️ Troubleshooting

### Erro: "Package name too similar"
```bash
# O nome "gd-ks" pode estar muito similar a outro pacote
# Tente: "gdks" ou "@muriloms/gd-ks" (scoped)
```

### Erro: "You must be logged in"
```bash
npm login
```

### Erro: "Cannot publish over existing version"
```bash
# Bump a versão primeiro
npm version patch
npm publish
```

### Usar pacote com escopo (scoped)
Se `gd-ks` estiver indisponível:
```json
{
  "name": "@muriloms/gd-ks",
  ...
}
```
```bash
npm publish --access public
```

---

## 📊 Comandos Úteis

```bash
# Ver versões publicadas
npm view gd-ks versions

# Ver detalhes do pacote
npm view gd-ks

# Depreciar versão antiga
npm deprecate gd-ks@0.1.0-alpha.1 "Use version 0.2.0 or higher"

# Ver downloads
# Acesse: https://www.npmjs.com/package/gd-ks
```

---

## ✅ Checklist de Publicação

- [ ] Conta NPM criada
- [ ] `npm login` executado
- [ ] Repositório GitHub criado
- [ ] Código pushed para GitHub
- [ ] `npm pack --dry-run` verificado
- [ ] Teste local funcionando
- [ ] `npm publish --tag alpha` executado
- [ ] Verificado em https://www.npmjs.com/package/gd-ks
- [ ] `npx gd-ks@alpha install` testado

---

## 🎉 Após Publicação

1. **Anunciar:**
   - Twitter/X
   - Reddit (r/gamedev, r/unrealengine)
   - Discord communities
   - Dev.to / Medium

2. **Documentação:**
   - GitHub Wiki
   - Site de documentação (opcional)

3. **Melhorias contínuas:**
   - Coletar feedback
   - Corrigir bugs
   - Adicionar features

---

**Boa sorte com a publicação! 🚀🎮**
