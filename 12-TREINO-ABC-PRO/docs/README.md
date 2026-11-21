### Ideia do projeto

- desenvolver um projeto React para TREINO de academia, podendo cadastrer até 5 treinos, em cada treino podendo adicionar exercicios
- o projeto deve ser um PWA para poder ser instalado em dispositivos mobile
- o projeto ser facil uso e intuitivo, ao criar um novo treino mostrar ação para adicionar exercicios
- o foco de uso do app será em device mobile, o layout deve ser pensado em telas menores, a usabilidade e disposição dos elementos devem seguir essa premissa
- o projeto não tera login, será uma página onde o usuário acessa e interage de forma livre sem permissionamentos ou autenticação

## paginas do projeto

- inicio
  area com calendario de treinos realizados
  blocos com numeros com
  dias do mes,
  treinos que o usuário deverá concluir no mes
  treinos não concluidos no mes (aqui o usuario pode começar e pular o treino)
  exercicios que deveria fazer ao mes
  exercicios que o usuário marcou como feito
  treino ativo
  lista de treinos cadastrados pelo usuario
- conta
  listar os dados do usuário como nome e email
- treino
  lista de treinos cadastrados
  podendo editar ou inativar o treino (não vamos excluir nada no projeto)
  botão para cadastrar novo treino
- treino em andamento
  aqui lista o treino ativo no momento
  lista os exercicios do treino
  na lista vamos ter opção de marcar/desmarcar o exercicios como realizado
  acompanhar o progresso do treino
  visualizar quantidade de exercicios
  tempo estimado de treino e tempo para termino contabilizando os exercicios pendentes com o seu tempo de descanso

## funcionalidades

- o app deve permitir a gestão de MODELO TREINO, como nome e quantidade de TREINOS (A, B e C)
- na tela de inicio deve mostrar os MODELOS DE TREINOS do usuário, e o MODELO de TREINO ATIVO
- quando o usuário der start em um determinado TREINO, o app deve guardar o progresso dos exercicios, onde para cada exercicios o usuário vai marcando como concluido e assim ele poderá visualizar o progresso do treino do dia, quantos exercicios já concluiu e quandos ainda faltam, e quanto em percentual já foi realizado
- só será permitido ter apenas um MODELO de TREINO ativo por vez, uma vez que o usuário der START em determinado MODELO de TREINO, todo o progresso dos demais será perdido
- na tela inicial vamos colocar um calendario onde marca se o usuário realizou treino naquele dia ou não
- na tela de treino onde o usuário vai poder visualizar e marcar cada exercicios, adicione campos para acompanhar o progresso decarga, coloque campos para preencher valor de peso
- ainda em cada exercicio coloque de alguma forma para poder adiciona link de video para que o usuário adicione e assim consiga visualizar o exercicio caso precise

## arquitetura do projeto

### libs e pacotes

- react-router-dom, tailwind, shadcn, zod, react-hook-fomrs, vitest, lucide-react

### diretórios

- views (cada página do projeto)
  (exemplos)
  page.tsx
  setup.tsx
  utils
  types

- components (componente genericos)
  ui (buttons, inputs, selects)
  commons (partes de layout)

- store
  system

- libs

- utils
