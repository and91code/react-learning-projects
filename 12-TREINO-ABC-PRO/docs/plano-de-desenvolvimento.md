# Treino ABC Pro — plano mestre de desenvolvimento

> Documento único de planejamento e acompanhamento. Atualize os status e marque os itens conforme cada etapa for implementada e validada. As decisões registradas como propostas devem ser confirmadas antes da etapa que depende delas.

## 1. Objetivo

Evoluir a aplicação atual para um PWA mobile-first de organização de treinos de academia, sem login e com dados locais. O usuário poderá manter até cinco modelos de treino; cada modelo contém treinos/rotinas, cada rotina contém exercícios e cada exercício define séries e repetições. Sessões guardam o progresso e a carga realizada em cada série.

## 2. Estado atual do projeto

### Já implementado

- [x] React, TypeScript, Vite, Tailwind CSS v4, Vitest e configuração shadcn/ui.
- [x] SQLite WASM no navegador, persistido no IndexedDB.
- [x] Treinos A/B/C e 30 exercícios iniciais baseados no plano HTML.
- [x] Busca, marcação de conclusão, progresso, cronômetro e CRUD de treinos/exercícios.
- [x] Build, lint e testes unitários básicos.

### Lacunas frente ao objetivo

- [ ] Navegação por páginas e separação da aplicação em views, components, store, libs e utils.
- [ ] Hierarquia modelo → treinos/rotinas → exercícios → séries realizadas.
- [ ] Limite de cinco modelos, reordenação e arquivamento com as regras definidas.
- [ ] Sessões retomáveis por data com histórico preservado; hoje a conclusão pertence ao exercício do modelo.
- [ ] Início, calendário, métricas mensais e perfil local.
- [ ] Registro de cargas e links de vídeo nos exercícios.
- [ ] Instalação PWA, funcionamento offline e testes de fluxos relevantes.
- [ ] Validação de formulários com Zod e React Hook Form.

## 3. Diretrizes e decisões

1. **Hierarquia do domínio.** Modelo de treino → vários treinos/rotinas (por exemplo, A, B e C) → exercícios → séries prescritas. Cada sessão referencia um treino/rotina e cria seus próprios exercícios de sessão; cada série realizada pertence a um único exercício de sessão.
2. **Um único modelo ativo por vez.** O usuário escolhe o modelo ativo. Iniciar uma rotina de outro modelo torna esse modelo ativo e desativa o anterior. A sugestão do próximo treino não altera o modelo ativo até o usuário iniciar a rotina sugerida.
3. **Até cinco modelos cadastrados.** A contagem considera ativos e arquivados. Ao atingir cinco, bloquear “Adicionar modelo”. Arquivar oculta o modelo da tela inicial, mas ele continua visível/editável na tela de modelos.
4. **Regras de arquivamento.** Um modelo ativo pode ser arquivado, desde que não tenha sessão em andamento. O modelo que contém a sessão em andamento não pode ser arquivado. Um modelo arquivado, suas rotinas e seus exercícios não podem ser iniciados; desarquivar torna-o elegível para seleção novamente.
5. **Não apagar modelos nem histórico.** A ação “excluir” atual será substituída por arquivar/desarquivar. Sessões e registros de carga concluídos permanecem no histórico.
6. **Persistência e retomada da sessão.** Salvar no SQLite cada alteração de dados da sessão, para que fechar e reabrir o app retome a rotina, o exercício e a série em andamento. Para o cronômetro, salvar duração e horário de início; ao retornar, calcular o tempo restante pelo relógio, sem depender de um intervalo ativo enquanto o app está fechado.
7. **Carga por série realizada.** Uma série recebe um único valor de carga e, opcionalmente, repetições realizadas. Exemplo: quatro séries de supino com cargas 20, 20, 25 e 30. Não registrar cargas diferentes por repetição individual. Cada registro de série aponta para um único exercício da sessão.
8. **Conclusão do exercício.** Cada série prescrita tem uma ação para registrá-la. Quando todas as séries forem registradas, o exercício é marcado automaticamente como concluído; o usuário ainda pode marcar o exercício manualmente.
9. **Três resultados de sessão.** “Concluído” quando todos os exercícios estiverem concluídos; “parcial” quando houver atividade em pelo menos um exercício, mas nem todos estiverem concluídos; “parado” quando a sessão foi iniciada, mas nenhum exercício foi iniciado. Uma sessão ainda aberta no app é “em andamento” e pode ser retomada.
10. **Substituição de sessão em andamento.** Iniciar outro treino encerra a sessão aberta como parcial ou parada conforme a atividade registrada. Preservar os exercícios/séries concluídos no histórico e descartar somente o progresso não concluído da sessão interrompida.
11. **Sugestão diária, sem agenda mensal.** Não há treinos previstos nem faltas mensais. Após concluir uma rotina, sugerir para o dia seguinte a próxima rotina não arquivada, seguindo a ordem configurada pelo usuário dentro do modelo ativo e voltando à primeira após a última. Dias sem treino não são considerados faltas.
12. **Calendário somente de treinos concluídos.** Marcar um dia apenas quando todos os exercícios da sessão estiverem concluídos. Sessões parciais, paradas ou ainda em andamento não aparecem como dia de treino concluído.
13. **Perfil local sem conta.** Guardar somente nome e foto localmente, sem autenticação, envio ou sincronização. Campos adicionais poderão ser solicitados quando houver armazenamento online.
14. **Foto de perfil recortada e compacta.** Usar `react-easy-crop` para recorte quadrado e gerar uma imagem WebP de até 512 × 512 px e 200 KiB. O usuário aprovou esses limites; validar/comprimir antes de persistir.
15. **Estimativa de duração.** Estimar 50 segundos por série, somar os descansos entre séries prescritas dos exercícios ainda não marcados como feitos e usar a duração definida do exercício para cardio. Exibir como estimativa, não promessa; permitir ajustar o tempo estimado do exercício.
16. **Persistência local sem backup nesta fase.** O SQLite/IndexedDB continua sem servidor. Limpar os dados do navegador ou trocar de dispositivo pode remover/indisponibilizar os dados; backup não faz parte do escopo atual e poderá ser reavaliado junto ao armazenamento online.
17. **Compatibilidade dos dados existentes.** Migrar os exercícios A/B/C atuais para um modelo inicial “Treino ABC Pro” com três rotinas ordenadas A, B e C. Preservar treinos e exercícios. Migrar a conclusão atual sem inventar data de sessão ou marcar dias concluídos retroativamente.

## 4. Etapas de desenvolvimento

### Etapa 0 — Alinhamento dos requisitos e regras de negócio

**Status:** [ ] Não iniciada · [ ] Em andamento · [ ] Bloqueada · [x] Concluída

- [x] Definir sugestão da próxima rotina, respeitando a ordem configurada dentro do modelo ativo; não haverá agenda nem contagem de treinos previstos/faltas no mês.
- [x] Definir a troca de sessão: interromper a anterior, preservar histórico concluído e descartar progresso pendente.
- [x] Definir o limite: cinco modelos no total, incluindo os arquivados.
- [x] Definir hierarquia: modelos contêm rotinas, rotinas contêm exercícios e cada série realizada pertence a um exercício da sessão.
- [x] Definir carga individual por série, não por repetição individual.
- [x] Definir conclusão automática quando todas as séries prescritas forem registradas, mantendo a opção de conclusão manual.
- [x] Definir reordenação das rotinas e restrições de arquivamento.
- [x] Definir perfil local: nome e foto; sem e-mail nesta fase.
- [x] Definir registro de carga por série.
- [x] Adiar backup até uma etapa futura de armazenamento online.
- [x] Definir retomada após fechar o app e recálculo do cronômetro pelo horário de início.
- [x] Definir os resultados de sessão e a regra de marcação do calendário.
- [x] Definir limite e comportamento de arquivamento na tela inicial e na tela de treinos.
- [x] Definir recorte e limites iniciais da foto de perfil.
- [x] Definir que abrir/visualizar um exercício não o conta como iniciado; iniciar deverá ser uma ação explícita.
- [x] Registrar estimativa inicial de tempo como padrão ajustável, sem apresentá-la como duração garantida.
- [x] Definir “pulado” como exercício não iniciado durante uma sessão; essa classificação não conclui o treino.
- [x] Definir que cada execução de treino terá uma data própria, editável pelo usuário; o calendário considera somente execuções com status `completed`.
- [x] Definir que o progresso legado por exercício não será convertido em sessões concluídas nem receberá datas inventadas.

**Critério de aceite:** decisões registradas e aplicadas nas etapas seguintes; sugestão diária não é apresentada como obrigação nem como meta mensal.

### Etapa 1 — Arquitetura, rotas e modelo de domínio

**Status:** [ ] Não iniciada · [ ] Em andamento · [ ] Bloqueada · [x] Concluída  
**Depende de:** Etapa 0

- [x] Organizar o código por responsabilidade: `src/views`, `src/components/ui`, `src/components/commons`, `src/store/system`, `src/domain/training`, `src/lib` e `src/utils`.
- [x] Adicionar `react-router-dom` e definir rotas para início, conta, treinos e sessão em andamento.
- [x] Definir tipos e contratos para perfil, modelo, rotina, exercício, sessão, exercício da sessão, série prescrita/realizada e registro de carga.
- [x] Definir estado global para perfil, modelo ativo, sessão em andamento e estado de inicialização do banco.
- [x] Adotar Zod + React Hook Form para validação dos formulários existentes.
- [x] Manter componentes de domínio separados de componentes genéricos shadcn/ui.

**Critério de aceite:** rotas acessíveis e estrutura implementada sem alterar a persistência nem quebrar os fluxos existentes. Verificado com build, lint, testes e smoke test mobile; os 30 exercícios e formulários existentes continuam funcionando.

### Etapa 2 — Persistência, migração e repositórios SQLite

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapa 1

- [x] Modelar tabelas `models`, `routines` e `routine_exercises` com posição e arquivamento (`src/lib/db/migrations.ts`).
- [ ] Modelar perfil local (armazenamento de perfil será concluído na Etapa 6).
- [x] Modelar sessões, snapshots dos exercícios, séries realizadas, cargas e cronômetros persistidos (Etapa 4).
- [x] Representar por exercício os estados “não iniciado”, “em andamento”, “concluído” e “pulado” (exercício que não foi iniciado na sessão); não derivar conclusão das séries.
- [x] Adicionar versão de schema (`PRAGMA user_version`) e migrações explícitas para bancos existentes.
- [x] Introduzir repositórios/serviços de domínio; remover SQL da camada de interface. (`model-repository.ts` e `routine-repository.ts`; `database.ts` apenas abre o banco e delega às funções dos repositórios.)
- [x] Persistir a posição dos modelos e das rotinas para suportar reordenação explícita (`reorderItems`), independente da ordem de criação.
- [x] Implementar exclusão lógica/arquivamento e limite validado de cinco modelos (`createModel`, `setModelArchived`). A regra de não arquivar modelo com sessão em andamento depende da tabela de sessões (Etapa 4).
- [x] Garantir transações para início/finalização de sessão e salvamento imediato de cada alteração de progresso.
- [x] Persistir estado de sessão e exercício/série atual, além de duração/horário de início do cronômetro para recuperar o tempo restante.
- [x] Tratar falhas de inicialização, migração, leitura e gravação com mensagem recuperável e ação para tentar novamente.
- [x] Definir a migração do progresso legado: manter as marcações existentes sem criar sessões/histórico ou atribuir datas fictícias; somente execuções reais com data e status `completed` aparecem no calendário.

**Critério de aceite:** banco novo e banco existente abrem corretamente; migrações não perdem dados; CRUD, limite e arquivamento são cobertos por testes.

### Etapa 3 — Navegação e gestão mobile-first

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 1 e 2

- [x] Criar shell de navegação mobile-first e estados de carregamento, vazio, erro e confirmação.
- [x] Criar telas de listagem, criação e edição de modelos, rotinas e exercícios, respeitando o limite de cinco modelos; manter modelos e listas de exercícios recolhíveis.
- [x] Ao criar um modelo, oferecer imediatamente a ação de adicionar a primeira rotina; dentro da rotina, oferecer a inclusão de exercícios.
- [x] Permitir reordenar modelos e rotinas sem alterar sua data de criação nem apagar histórico.
- [x] Permitir arquivar/desarquivar modelos; ocultar arquivados somente na tela inicial e manter todos visíveis/editáveis na tela de modelos.
- [x] Impedir arquivamento do modelo que contém a sessão em andamento; permitir arquivar o modelo ativo se não houver sessão em andamento.
- [x] Impedir iniciar um modelo arquivado ou qualquer rotina/exercício pertencente a ele.
- [x] Bloquear “Adicionar modelo” ao atingir cinco modelos, contando os arquivados, e explicar o limite na tela.
- [x] Criar formulário de exercício com seleção do catálogo HTML e preenchimento sugerido confirmado ao editar; incluir grupo muscular, séries/repetições, descanso, instrução e link opcional de vídeo com prévia incorporada.
- [x] Validar dados e apresentar erros junto aos campos com rótulos acessíveis.
- [ ] Preservar e adaptar o tema visual atual, priorizando telas pequenas e uso com uma mão.

**Critério de aceite:** fluxos de treino/exercício funcionam em viewport mobile; um sexto modelo é impedido com explicação clara; nenhuma ação remove dados permanentemente. A validação mobile final e as restrições relacionadas a sessões ficam pendentes.

### Etapa 4 — Sessão de treino em andamento

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 0, 2 e 3

- [x] Implementar ação “Iniciar treino” em uma rotina não arquivada do modelo ativo.
- [x] Criar sessão com data editável e cópia ordenada dos exercícios/séries prescritas como orientação.
- [x] Permitir registrar cada série e marcar automaticamente o exercício quando todas forem registradas; manter a ação manual de conclusão.
- [x] Oferecer ação explícita para iniciar cada exercício; apenas visualizar não altera seu estado.
- [x] Registrar cada série com carga e repetições próprias; persistir a série atual para retomada.
- [x] Exibir progresso absoluto/percentual, exercícios concluídos e pendentes.
- [x] Persistir alterações no SQLite e retomar automaticamente a sessão após reabrir o app.
- [x] Calcular tempo restante com exercícios/séries pendentes, descanso e estimativa configurável.
- [x] Usar estimativa inicial de 50 segundos por série mais descanso entre séries; permitir duração própria e ajuste para cardio.
- [x] Persistir início/duração do descanso, recalcular ao retomar e exibir quando o tempo terminar durante o fechamento do app.
- [x] Implementar estados em andamento, concluído, parcial e parado segundo as regras definidas.
- [x] Ao iniciar outra sessão, preservar exercícios concluídos e descartar registros de séries pendentes da sessão anterior.

**Critério de aceite:** após fechar/reabrir, a sessão e o cronômetro retomam do estado e tempo corretos; as transições implementadas ainda aguardam a validação integrada final.

### Etapa 5 — Início, sugestão diária e histórico mensal

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 0, 2 e 4

- [ ] Criar início com modelo ativo, modelos cadastrados e atalho para iniciar sessão.
- [x] Exibir calendário mensal com dias em que houve treino e acesso às sessões daquele dia.
- [x] Mostrar total de sessões/treinos concluídos e exercícios concluídos no mês, sem metas ou faltas.
- [x] Após concluir uma rotina, sugerir para o dia seguinte a próxima rotina na ordem definida pelo usuário dentro do modelo ativo; voltar à primeira após a última.
- [x] Não marcar no calendário sessões parciais, paradas ou em andamento.
- [x] Permitir abrir um dia para consultar as sessões e exercícios registrados.
- [x] Tratar mudança de mês e mês sem sessões.

**Critério de aceite:** funcionalidades implementadas; conferir correspondência com banco e fluxo completo na validação integrada final.

### Etapa 6 — Perfil local e evolução de carga

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 2, 3 e 4

- [x] Criar página de conta/perfil local para nome e foto, sem e-mail ou autenticação nesta fase.
- [x] Adicionar dependência `react-easy-crop`, fluxo de seleção/recorte quadrado e compressão WebP com máximo de 512 × 512 px e 200 KiB antes de salvar.
- [x] Adicionar entrada de carga e, opcionalmente, repetições por série durante a sessão.
- [x] Associar cada valor ao exercício, à série e à sessão/data, preservando registros anteriores.
- [x] Exibir histórico simples de carga por exercício, ordenado por data.
- [x] Permitir editar/limpar um registro somente com confirmação, sem apagar a sessão.
- [x] Validar valores numéricos, unidade exibida e campos vazios.

**Critério de aceite:** funcionalidades implementadas e cobertas por testes de repositório; validação manual final permanece pendente.

### Etapa 7 — PWA e experiência offline

**Status:** [ ] Não iniciada · [x] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 1 a 4

- [x] Adicionar manifest, ícone, nome curto, cores e modo de exibição instalável.
- [x] Configurar service worker e estratégia de cache para shell e assets carregados.
- [ ] Garantir acesso offline às telas e operações locais após a primeira carga.
- [x] Exibir estado offline sem bloquear o treino.
- [ ] Definir política para versão nova do app e atualização do schema SQLite.
- [ ] Validar instalação e navegação em Android, iOS/Safari e desktop suportados.

**Critério de aceite:** app instalável, inicia sem rede após carregamento inicial e não perde dados em atualizações compatíveis.

### Etapa 8 — Qualidade, acessibilidade e preparação para uso

**Status:** [ ] Não iniciada · [ ] Em andamento · [ ] Bloqueada · [ ] Concluída  
**Depende de:** Etapas 2 a 7

- [ ] Adicionar testes unitários para regras de domínio, limites, sequência sugerida e estimativa de duração.
- [ ] Adicionar testes de integração para migração, repositórios, sessão e persistência.
- [ ] Testar fluxos essenciais de interface: criar modelo/exercício, iniciar, marcar, concluir e consultar histórico.
- [ ] Validar navegação por teclado, nomes acessíveis, contraste e áreas de toque em mobile.
- [ ] Informar claramente que os dados são locais e podem não estar disponíveis após limpar o armazenamento ou trocar de dispositivo; backup fica fora do escopo atual.
- [ ] Atualizar README de execução, armazenamento local e limitações; deixar explícito que backup não está incluído.
- [ ] Executar build, lint, testes e checklist manual em viewport mobile antes de liberar.

**Critério de aceite:** verificações automatizadas passam; limitações da persistência local são comunicadas; fluxos essenciais são utilizáveis sem mouse e em telas pequenas.

## 5. Ordem de execução e dependências

```text
Etapa 0 → Etapa 1 → Etapa 2 → Etapa 3 → Etapa 4 → Etapa 5
                                      ├────────────→ Etapa 6
                    Etapas 1–4 ───────────────────→ Etapa 7
                    Etapas 2–7 ───────────────────→ Etapa 8
```

As etapas 5 e 6 podem avançar em paralelo após sessão e persistência definidas. A etapa 7 pode avançar em paralelo à gestão de telas após o shell e o modelo de dados estabilizarem.

## 6. Registro de decisões e bloqueios

| Data | Etapa | Decisão, pergunta ou bloqueio | Responsável/resultado |
|---|---|---|---|
| 2026-11-21 | 0 | Sem agenda mensal: depois de concluir uma rotina, sugerir para o dia seguinte a próxima rotina na ordem configurada; dias sem treino não são faltas. | Definido |
| 2026-11-21 | 0 | Ao iniciar outro treino, interromper a sessão anterior, preservar histórico concluído e descartar somente progresso pendente. | Definido |
| 2026-11-21 | 0 | Máximo de cinco modelos no total, contando os arquivados. Arquivar oculta da tela inicial; não pode arquivar modelo com sessão em andamento; arquivados e seu conteúdo não iniciam. | Definido |
| 2026-11-21 | 0 | Perfil local terá nome e foto; informações adicionais poderão ser solicitadas quando houver armazenamento online. | Definido |
| 2026-11-21 | 0 | Carga registrada por série; backup local adiado até a evolução para armazenamento online. | Definido |
| 2026-11-21 | 0 | Sessão e cada alteração persistidas; cronômetro recuperado por duração e horário de início após fechar/reabrir. | Definido |
| 2026-11-21 | 0 | Estados: concluído (todos exercícios feitos), parcial (atividade, mas incompleto), parado (nenhum exercício iniciado) e em andamento (retomável). | Definido |
| 2026-11-21 | 0 | Calendário marca somente sessões com todos os exercícios concluídos. | Definido |
| 2026-11-21 | 0 | Arquivar oculta o modelo apenas da tela inicial; modelos arquivados continuam visíveis/editáveis na tela de treinos e contam no limite de cinco. | Definido |
| 2026-11-21 | 0 | Foto recortada com `react-easy-crop`; WebP até 512 × 512 px e 200 KiB. | Aprovado |
| 2026-11-21 | 0 | Um exercício só conta como iniciado após ação explícita; estimativa de 50 segundos por série, ajustável, além do descanso. | Definido |
| 2026-11-21 | 0 | Modelo contém rotinas; rotinas contêm exercícios; cada série realizada aponta para um exercício da sessão e possui carga própria. Migrar ABC existente para um modelo com rotinas A/B/C. | Definido |
| 2026-11-21 | 0 | A ordem da próxima rotina é definida pelo usuário por reordenação, não pela data de cadastro. | Definido |
| 2026-11-21 | 0 | Atualização de escopo: cada série tem ação de registro e o exercício é concluído automaticamente ao registrar todas as séries; conclusão manual também permanece disponível. | Definido pelo usuário |

## 7. Histórico de atualização deste plano

| Data | Atualização |
|---|---|
| 2026-11-21 | Plano inicial consolidado a partir do app existente e dos critérios em `docs/README.md`. |
| 2026-11-21 | Regras da etapa 0 definidas: sugestão diária em sequência, sessão anterior interrompida sem perder histórico concluído, máximo de cinco modelos incluindo arquivados, perfil com nome/foto e carga por série. Backup adiado. |
| 2026-11-21 | Detalhadas retomada persistente da sessão/cronômetro, estados concluído/parcial/parado, regra do calendário, visibilidade e edição dos arquivados, e recorte/compressão de foto. |
| 2026-11-21 | Aprovados limites da foto (WebP 512 × 512 px / 200 KiB); estimativa alterada para 50 segundos por série; conclusão do exercício definida como ação manual, independente dos registros de série. |
| 2026-11-21 | Esclarecida hierarquia modelo → rotina → exercício → série realizada; carga própria por série; reordenação manual e restrições de arquivamento; migração de A/B/C para modelo inicial Treino ABC Pro. |
| 2026-11-21 | Etapa 1 concluída: React Router, views, estado Zustand, schemas Zod e formulários React Hook Form; persistência existente preservada. |
| 2026-11-21 | Etapa 4: persistência de sessões, retomada automática e cronômetro recuperável implementados; typecheck e lint aprovados. |
| 2026-11-21 | Etapa 5 iniciada: histórico mensal, calendário com marcação exclusiva para sessões concluídas, métricas e sugestão de rotina implementados; validação integrada pendente. |
| 2026-11-21 | Ajuste de escopo: cadastro e schema local reparados por migrações aditivas; contagem de séries conclui automaticamente o exercício; Home sem lista de exercícios. Suíte: 26 testes aprovados. |
| 2026-11-21 | Etapa 6 implementada: perfil local com recorte/compressão de foto e histórico editável de cargas; validação manual final pendente. |
| 2026-11-21 | Etapa 7 iniciada: manifest, ícone, cache de shell/recursos e indicador offline implementados; validação de instalação e operação offline em dispositivos ainda pendente. |
