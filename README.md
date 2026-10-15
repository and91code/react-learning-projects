# 🧪 Frontend Playground & React Ecosystem Journey

Este repositório centraliza meus projetos de estudos e práticas focados em **React**, **Tailwind CSS**, **Zustand** e arquitetura de software para frontend. O objetivo principal é consolidar conceitos modernos de desenvolvimento de interfaces, gerenciamento de estado global, reusabilidade de componentes e boas práticas de experiência do usuário (UX/UI).

---

## 🎯 Objetivos do Repositório

- **Aprofundamento no Ecossistema React:** Explorar recursos avançados do React (Hooks customizados, Server/Client Components, otimizações de renderização).
- **Gerenciamento de Estado Moderno:** Aplicar o **Zustand** como alternativa leve e escalável ao Context API e Redux para estados globais e complexos.
- **Estilização Ágil e Produtiva:** Dominar o **Tailwind CSS** para a construção de interfaces responsivas, design systems simples e componentes acessíveis.
- **Portfólio de Evolução:** Registrar o histórico de aprendizado, experimentos visuais e tomadas de decisão técnicas no desenvolvimento frontend.

---

## 📁 Estrutura do Monorepo

```text
.
├── 01-todo-zustand-tailwind/       # Projeto inicial: Todo App com estado global em Zustand e UI Tailwind
│   ├── src/
│   │   ├── components/            # Componentes visuais e modulares
│   │   ├── stores/                # Gerenciamento de estado com Zustand
│   │   └── styles/                # Configurações e utilitários do Tailwind CSS
│   └── README.md                  # Documentação específica do projeto
│
├── 02-dashboard-design-system/     # (Futuro) Dashboard com UI kit reutilizável e gerenciamento avançado
└── README.md                       # Visão geral do repositório
```

---

## 🧩 Entendimento da arquitetura de estados e componentes

A camada de componentes e stores (`src/components` e `src/stores`) é o coração conceitual da aplicação frontend. Ela define a experiência do usuário e reúne os elementos visuais e de fluxo de dados que representam o comportamento da aplicação.

### O que ela representa

Em projetos como este, a arquitetura frontend concentra a lógica de apresentação e o estado da interface, por exemplo:

- gerenciamento de preferências (tema claro/escuro)
- estado de formulários e validações
- listas de tarefas, filtros e ordenações
- feedbacks visuais (loaders, modais, toasts)
- persistência de sessão e dados locais

Essa estrutura serve como base para garantir que componentes permaneçam desacoplados da lógica complexa de estado.

### Regras de uso do diretório

A organização do código deve ser usada para expressar clareza de interface e previsibilidade no fluxo de dados.

Ele deve conter:

- componentes visuais limpos e reutilizáveis
- custom hooks para encapsular lógica de UI
- stores do Zustand focadas em domínios específicos de estado
- configurações de design tokens e temas via Tailwind CSS
- tratamentos de interatividade e estados de interface

Ele deve evitar:

- lógica pesada de regras de negócio misturada com marcação JSX
- acoplamento excessivo entre componentes filhos e pais
- duplicação de estilos quando reutilizáveis via componentes ou utilitários
- mutação direta de estado fora de ações declaradas no Zustand
- re-renders desnecessários motivados por consumo indevido de estado global

### Visão prática

A camada de interface e estado responde à pergunta: “como isso deve ser apresentado e como a tela reage às ações do usuário?”

E não: “como a API remota processa a validação final?” ou “de qual banco de dados essa informação veio?”

Essa separação é importante porque permite que a aplicação mantenha uma UI reativa, rápida e fácil de refatorar, mesmo quando a API externa ou os requisitos visuais mudam.

### Exemplo de modelo de estado

O estado da aplicação representa conceitos como:

- uma store de tarefas que controla adição, remoção e conclusão
- um filtro ativo que altera dinamicamente a exibição da lista
- um estado de tema global compartilhado entre múltiplos componentes
- dados persistidos no `localStorage` sincronizados via Zustand

Essas interações formam a base da aplicação e ajudam a manter o código coerente entre a renderização do React, o estilo do Tailwind e o fluxo do Zustand.

### Regra de ouro

O componente React deve ser focado em renderizar a tela; a store do Zustand deve ser focada em gerenciar o estado.

Se uma lógica visual ou de estado pode ser isolada ou simplificada, ela não deve sobrecarregar a árvore de componentes.