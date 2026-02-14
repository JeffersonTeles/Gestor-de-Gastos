# Instruções para Limpeza de Branches

## Status Atual das Branches

Com base na análise do repositório, as seguintes branches existem:

### Branch para Manter
- ✅ **main** - Branch principal (será preservada)

### Branches para Deletar
- ❌ **master** - Duplicata da branch main
- ❌ **copilot/delete-other-branches** - Branch do PR atual (pode ser deletada após o merge)
- ❌ **copilot/fix-receita-categorization** - Branch antiga do copilot
- ❌ **copilot/improve-feature** - Branch antiga do copilot
- ❌ **copilot/improve-what-is-needed** - Branch antiga do copilot
- ❌ **gh-pages** - Branch do GitHub pages

## Como Deletar as Branches

### Opção 1: Usando a Interface Web do GitHub (Recomendado)
1. Acesse https://github.com/JeffersonTeles/Gestor-de-Gastos
2. Clique em "branches" (mostra a contagem de branches)
3. Para cada branch que você quer deletar:
   - Encontre a branch na lista
   - Clique no ícone de lixeira ao lado dela
   - Confirme a exclusão

### Opção 2: Usando Linha de Comando Git
Se você preferir usar a linha de comando, execute estes comandos da sua máquina local:

```bash
# Deletar branches remotas
git push origin --delete master
git push origin --delete copilot/fix-receita-categorization
git push origin --delete copilot/improve-feature
git push origin --delete copilot/improve-what-is-needed
git push origin --delete gh-pages

# Após este PR ser merged, delete também:
git push origin --delete copilot/delete-other-branches
```

### Opção 3: Usando o Script Automático
Um script foi criado para facilitar a limpeza. Para usá-lo:

```bash
# Executar o script
./cleanup-branches.sh
```

O script irá perguntar se você quer continuar antes de deletar as branches.

### Opção 4: Usando GitHub CLI
Se você tem o GitHub CLI instalado:

```bash
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/master -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/fix-receita-categorization -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/improve-feature -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/improve-what-is-needed -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/gh-pages -X DELETE
```

## Após a Limpeza

Depois de deletar todas as branches exceto `main`, você terá:
- Apenas a branch `main` restante
- Uma estrutura de repositório mais limpa
- Gerenciamento de branches mais fácil daqui pra frente

## Observações

- A branch `copilot/delete-other-branches` (branch do PR atual) deve ser deletada após este PR ser merged
- Certifique-se de ter qualquer código importante de outras branches antes de deletá-las
- A branch `main` contém a versão estável mais recente do seu projeto
