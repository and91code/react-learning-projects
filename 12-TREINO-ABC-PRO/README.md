# Treino ABC Pro

Aplicação React + TypeScript criada a partir do plano de treino ABC em HTML. Permite consultar, pesquisar e marcar exercícios como concluídos, controlar o descanso e personalizar treinos e exercícios.

## Executar

```bash
npm install
npm run dev
```

Validações:

```bash
npm run build
npm run lint
npm test
```

## Banco de dados

O SQLite roda no navegador com `@sqlite.org/sqlite-wasm`. Os treinos, exercícios e marcações de conclusão são gravados como um banco SQLite serializado no IndexedDB do navegador. Não há servidor ou conta compartilhada: os dados ficam neste navegador e nesta origem.

Na primeira abertura são criados os treinos A, B e C com os exercícios do plano de referência. Os treinos e exercícios podem ser criados, editados e removidos pela interface.

## Interface

Tailwind CSS v4 e componentes no padrão shadcn/ui. A configuração shadcn está em `components.json`.

## Arquitetura atual

- `src/views`: páginas de início, treinos, conta e sessão.
- `src/components/ui` e `src/components/commons`: componentes de interface e componentes compartilhados.
- `src/domain/training`: tipos e schemas Zod do domínio de treinos e sessões.
- `src/store/system`: estado global da aplicação com Zustand.
- `src/lib`: acesso SQLite; `src/utils`: funções auxiliares.

As rotas atuais são `/`, `/treinos`, `/conta` e `/sessao`. A página inicial exibe um calendário mensal baseado somente em sessões concluídas, métricas do mês e o próximo treino sugerido pela ordem das rotinas do modelo ativo. O cadastro de modelos, treinos e exercícios fica em `/treinos`. A tela `/sessao` mantém os exercícios fora da página inicial, salva estado/data/séries/cargas/descanso no SQLite e retoma uma sessão em andamento ao reabrir o app. Ao registrar todas as séries prescritas, o exercício é marcado automaticamente como concluído. A conta permite salvar nome/foto local e consultar o histórico de cargas. Em produção, o app registra um service worker para instalação e cache offline do shell e dos recursos carregados; os dados permanecem no IndexedDB deste navegador.

O schema SQLite é versionado (`PRAGMA user_version`) em `src/lib/db/migrations.ts` e inclui modelos, rotinas, exercícios e snapshots de sessões. As migrações também reparam colunas ausentes de versões intermediárias sem apagar os registros existentes. Bancos legados com `workouts`/`exercises` são convertidos automaticamente para o modelo “Treino ABC Pro”, preservando ids e progresso. A tela Treinos permite gerenciar modelos, rotinas e exercícios em listas recolhíveis; o limite de cinco modelos conta também os arquivados. O catálogo de 30 sugestões, baseado no HTML de referência, fica em `src/domain/training/exercise-catalog.ts`. Links de vídeo tentam abrir em player incorporado e continuam acessíveis em uma nova aba. O limite e o arquivamento estão em `src/lib/db/model-repository.ts`.

Os dados são locais a este navegador e origem, armazenados no IndexedDB; não há sincronização ou backup. Limpar os dados do navegador ou trocar de dispositivo pode torná-los indisponíveis.

Os formulários existentes usam React Hook Form e Zod. Build, lint e testes são executados com os comandos indicados acima.
