---
name: workout-domain-rules
description: Regras de negócio, terminologia e decisões de domínio para apps de treino de academia (treinos, divisões, séries, repetições, carga, descanso, progressão de carga, RPE/RIR, séries avançadas e histórico de execução). Use sempre que criar ou alterar telas, estados, cálculos ou fluxos de treino.
---

# Domínio: Treino de Academia

Esta skill define as premissas e regras de negócio para modelar e desenvolver funcionalidades de treino, séries, progressão, intensidade e registro histórico.

## Conceitos Centrais

- **Treino / Rotina / Divisão:** Agrupamento de exercícios planejados para um dia ou objetivo (ex.: A/B/C, Push/Pull/Legs, Upper/Lower, Full Body).
- **Exercício:** Movimento específico vinculado a um treino, com ordem de execução, grupo muscular principal e secundário, equipamento e observações técnicas.
- **Série (Set):** Cada bloco de execução de um exercício, com ordem sequencial e tipo definido.
- **Carga, Repetições e Tempo/Distância:** Métricas de execução (carga absoluta, peso corporal/adicional, faixa de reps, tempo sob tensão ou distância/cardio).
- **Descanso (Rest Timer):** Intervalo de recuperação entre séries (e, opcionalmente, entre exercícios).
- **RPE (Rate of Perceived Exertion) e RIR (Reps in Reserve):** Escalas de esforço percebido (`RPE` geralmente de 1 a 10, com foco prático em 6–10) e repetições na reserva (`RIR`, quantas repetições ainda seriam possíveis com boa técnica antes da falha).
- **Progressão de Carga:** Evolução sistemática do estímulo ao longo do tempo (ex.: dupla progressão de reps/carga, progressão linear de carga, aumento de séries válidas ou redução de RIR/descanso).
- **Séries Avançadas:** Técnicas de intensificação além da série de trabalho padrão (ex.: _aquecimento_, _top set_, _drop set_, _rest-pause_, _cluster set_, _myo-reps_, _biset/superset_, _falha técnica_).
- **Histórico de Execução:** Registro imutável ou versionado das sessões de treino concluídas, comparando performance passada com a sessão atual.

## Regras de Negócio Padrão

### 1. Ordem, Identidade e Estrutura

- Cada série dentro de um exercício deve ter número/ordem sequencial claro (`1, 2, 3...`) e tipo explícito.
- Alterar a ordem de exercícios ou séries deve preservar a integridade dos dados registrados e evitar índices quebrados ou cronômetros órfãos.

### 2. Separação entre Planejado e Executado

- Diferencie sempre o **planejado** (meta de séries, faixa de reps, carga/RPE alvo) do **executado** (carga real, reps feitas, conclusão, RPE/RIR real).
- Concluir uma série não deve sobrescrever silenciosamente a meta planejada, salvo regra explícita.

### 3. Progressão de Carga

- Sugestões ou cálculos de progressão devem considerar o histórico recente do mesmo exercício (e idealmente respeitar contexto de equipamento/incremento, como `1kg`, `2kg` ou `2.5kg`).
- Não assuma aumento automático de carga se o usuário não atingiu a faixa mínima de repetições ou se o RPE/RIR indicou esforço excessivo/falha, a menos que a regra do plano preveja isso.
- Deixe claro quando um valor exibido é uma **sugestão de progressão** versus um **valor já registrado**.

### 4. RPE e RIR

- Valide escalas de forma coerente (ex.: `RPE` entre `1` e `10`, permitindo passos de `0.5` se suportado; `RIR` inteiro não-negativo, ex.: `0` a `5+`).
- Trate RPE/RIR como dado opcional ou complementar, nunca bloqueando a conclusão de uma série caso o usuário não informe o esforço percebido.
- Mantenha consistência semântica entre `RPE` e `RIR` quando ambos forem exibidos (ex.: `RPE 10` equivale a `0 RIR`).

### 5. Séries Avançadas

- Séries avançadas devem modelar sua especificidade sem quebrar a estrutura base de uma série (ex.: _drop set_ pode ter múltiplas quedas de carga/reps vinculadas à mesma série; _superset_ agrupa exercícios em sequência com descanso específico).
- Séries de _aquecimento_ e técnicas especiais devem ser identificáveis para não distorcer métricas como volume total, recordes pessoais (PR) ou contagem de séries de trabalho, conforme regra definida.

### 6. Histórico de Execução

- Um treino concluído representa um **snapshot histórico** da execução real: alterações futuras na ficha/template de treino não devem alterar retroativamente treinos já finalizados.
- O histórico deve permitir consulta rápida da última execução do mesmo exercício (carga, reps, data e eventual RPE/RIR) para apoiar a tomada de decisão durante o treino ativo.
- Garanta tratamento seguro para treinos abandonados, incompletos ou editados após a conclusão.

### 7. Validações e Resiliência no Treino Ativo

- Impeça valores inválidos (como carga negativa ou tempo de descanso negativo) e trate casos de peso corporal (`0` de carga externa ou peso corporal + carga extra).
- Priorize baixa fricção na tela de treino ativo e preservação do estado em andamento contra recarregamentos ou saídas acidentais.

## Quando Perguntar ao Usuário (Regra de Ouro)

Antes de implementar ou alterar uma regra de negócio ambígua ou não especificada, **pare e pergunte objetivamente**, por exemplo:

1. **Progressão de carga:** A progressão deve ser apenas sugestão visual na tela ou aplicada automaticamente na próxima sessão? Qual critério dispara o aumento (ex.: topo da faixa de reps com `RIR >= 1` ou `RPE <= 8.5`)?
2. **RPE / RIR:** O app usará `RPE`, `RIR` ou ambos? Haverá suporte a valores decimais (como `8.5` de RPE) e limite de `0` (falha)?
3. **Séries avançadas:** Quais tipos de série existirão no MVP (`aquecimento`, `trabalho`, `drop set`, `rest-pause`, `falha`) e como cada tipo entra no cálculo de volume e PR?
4. **Histórico e edição:** A última execução exibida durante o treino vem do último treino concluído daquele exercício específico ou da mesma divisão/ficha? Treinos finalizados podem ser editados depois ou são somente leitura/corrigíveis via ajuste?
5. **Carga / Peso corporal:** Como serão representados exercícios de peso corporal (ex.: barra fixa/paralelas) quando houver adição de peso (`+10kg`) ou subtração (`-20kg` em máquina assistida)?
