# FluxoForte (Vite + Supabase)

Aplicacao de gestao financeira com autenticacao, sincronizacao em nuvem e realtime via Supabase.

## Estrutura Tecnica

- `script.js`: orquestracao de UI, estado e sincronizacao.
- `import-utils.js`: parser multi-formato (JSON/CSV/OFX), normalizacao e deduplicacao.
- `financial-engine.js`: motor financeiro puro (score, projecoes e anomalias).
- `app-utils.js`: utilitarios de formatacao, escape, download e funcoes de UI compartilhadas.
- `storage-utils.js`: leitura/escrita de estado no `localStorage`.
- `supabase.sql`: schema principal para setup rapido.
- `supabase/migrations/`: versoes de schema para historico de mudancas.

## Funcionalidades

- Lancamentos com criacao, edicao e exclusao.
- Metas gerais (despesa total e economia).
- Categorias personalizadas por usuario.
- Orcamento por categoria com alerta de aproximacao/estouro.
- Grafico de distribuicao de despesas por categoria.
- Exportacao CSV do historico filtrado.
- Relatorio mensal em CSV e PDF.
- Sincronizacao em tempo real com Supabase.
- Modulo de inteligencia financeira (score, previsao e anomalias).
- Laboratorio de cenarios com projecao de estrategia em 6 meses.
- Telemetria de uso por eventos no Supabase (`usage_events`).
- Bloco de metodologia explicavel dentro do app.
- Importacao multi-banco em JSON, CSV e OFX com deduplicacao.
- Regras automaticas de categorizacao por palavra-chave (sem custo).
- Lancamentos recorrentes com geracao mensal em 1 clique (sem custo).
- Fechamento mensal em 1 clique (gera CSV + PDF).
- Modo assistido de primeiro uso (wizard em 3 passos).
- Importacao por arrastar/soltar com inferencia automatica de banco/origem.
- Importacao em lote (multiplos arquivos) com deduplicacao no mesmo processamento.
- Checklist de fechamento mensal antes da geracao de relatorios.
- Revisao de importacao antes de salvar (edicao por linha, confianca e sugestoes locais por IA).
- Desfazer ultimo lote importado, log de auditoria de importacoes e status por lote.
- Reenvio manual de transacoes pendentes quando sincronizacao em nuvem falha.
- Resumo mensal/anual com diagnostico de base (quantidade de transacoes e totais usados).
- Comparativo anual (ano selecionado vs ano anterior) para receita, despesa e saldo.

## Rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Inicie em modo desenvolvimento:

```bash
npm run dev
```

## Testes

Execute os testes automatizados:

```bash
npm run test:run
```

Inclui testes do motor financeiro e do parser de importacao.

3. Abra a URL mostrada pelo Vite (normalmente `http://localhost:5173`).

## Variaveis de ambiente

Este projeto usa:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O arquivo `.env.example` mostra o formato.

## Banco Supabase

Execute o script `supabase.sql` no SQL Editor do Supabase para criar/atualizar tabelas, policies e triggers.

Para projetos em evolucao, prefira aplicar arquivos versionados em `supabase/migrations/` na ordem numerica.

## Importacao Multi-Banco

No bloco `Importacao Multi-Banco` do app:

1. Informe `Banco/Origem` (ex.: Nubank, Itau, Mercado Pago).
2. Envie arquivo (`.json`, `.csv`, `.ofx`) ou cole o conteudo bruto.
3. Clique em `Importar Lancamentos`.

O sistema faz:

- Normalizacao de data e valor.
- Criacao automatica de categorias novas.
- Deduplicacao para evitar importar a mesma transacao duas vezes.

Limites atuais:

- Maximo de 10 MB por arquivo importado.
- Importacoes grandes devem ser divididas em lotes.

## Deploy

### Vercel

1. Importar o repositorio na Vercel.
2. Definir variaveis de ambiente:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
3. Deploy usando configuracao em `vercel.json`.

Troubleshooting rapido:

- Erro de autenticacao: execute `npx vercel login` novamente.
- Erro de projeto invalido: escolha nome de projeto sem caracteres especiais.
- Build sem variaveis: confirme `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel da Vercel.

### Netlify

1. Importar o repositorio na Netlify.
2. Definir variaveis de ambiente:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
3. Build e redirects ja configurados em `netlify.toml`.

## Roadmap de Futuras Atualizacoes

Itens sem custo ja implementados primeiro.

Para evolucoes com custo (como Open Finance oficial via agregadores), consulte `FUTURE_UPDATES.md`.
