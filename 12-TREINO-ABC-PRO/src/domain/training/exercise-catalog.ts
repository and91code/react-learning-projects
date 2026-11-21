export type ExerciseSuggestion = {
  id: string
  routine: 'A' | 'B' | 'C'
  name: string
  muscle: string
  setsReps: string
  rest: number
  tip: string
}

export const exerciseCatalog: ExerciseSuggestion[] = [
  { id: 'a1', routine: 'A', name: 'Supino Inclinado com Halteres (30º)', muscle: 'Peitoral Superior (Clavicular)', setsReps: '3 x 12', rest: 60, tip: 'Mantenha os cotovelos levemente fechados (45º em relação ao tronco) e controle a descida por 2 segundos.' },
  { id: 'a2', routine: 'A', name: 'Supino Reto (Barra ou Máquina)', muscle: 'Peitoral Médio (Esternal)', setsReps: '3 x 12', rest: 60, tip: 'Escápulas retraídas contra o banco. Empurre de forma explosiva e desça até a linha média do peito.' },
  { id: 'a3', routine: 'A', name: 'Crossover Polia Alta', muscle: 'Peitoral Inferior (Costal)', setsReps: '3 x 12-15', rest: 45, tip: 'Polias no topo, dê um passo à frente, incline levemente o tronco e feche as mãos na linha do quadril.' },
  { id: 'a4', routine: 'A', name: 'Crucifixo Máquina (Peck Deck)', muscle: 'Definição e Miolo do Peitoral', setsReps: '3 x 15', rest: 45, tip: 'Segure a contração máxima por 1 segundo no centro antes de abrir os braços de forma controlada.' },
  { id: 'a5', routine: 'A', name: 'Desenvolvimento com Halteres', muscle: 'Deltóide Anterior e Lateral', setsReps: '3 x 12', rest: 60, tip: 'Abdômen contraído para não arquear a lombar. Suba os halteres sem bater um no outro no topo.' },
  { id: 'a6', routine: 'A', name: 'Elevação Lateral', muscle: 'Deltóide Lateral (Largura)', setsReps: '3 x 15', rest: 45, tip: 'Suba os cotovelos até a altura dos ombros, mantendo os punhos neutros e sem balançar o tronco.' },
  { id: 'a7', routine: 'A', name: 'Elevação Frontal', muscle: 'Deltóide Anterior', setsReps: '2 x 15', rest: 45, tip: 'Movimento contínuo até a linha dos olhos, evitando impulso com o quadril.' },
  { id: 'a8', routine: 'A', name: 'Tríceps Testa (Barra W ou Halteres)', muscle: 'Cabeça Longa do Tríceps', setsReps: '3 x 12', rest: 45, tip: 'Mantenha os cotovelos apontados para o teto e fixos; mova apenas os antebraços.' },
  { id: 'a9', routine: 'A', name: 'Tríceps Pulley (Corda)', muscle: 'Cabeças Lateral e Medial', setsReps: '3 x 15', rest: 45, tip: 'Abra as pontas da corda no final do movimento para espremer completamente o tríceps.' },
  { id: 'a10', routine: 'A', name: 'Prancha Frontal', muscle: 'Transverso do Abdômen (Core)', setsReps: '3 x 45-60s', rest: 45, tip: 'Contraia glúteos e abdômen como se estivesse fechando um zíper apertado; não deixe o quadril cair.' },
  { id: 'a11', routine: 'A', name: 'Cardio Pós-Treino (Esteira Inclinada)', muscle: 'Queima Calórica e Resistência', setsReps: '20 min', rest: 0, tip: 'Ajuste a inclinação entre 6% e 8% com velocidade firme (5.5 a 6.0 km/h) sem segurar no painel.' },
  { id: 'b1', routine: 'B', name: 'Puxada Alta (Pegada Aberta)', muscle: 'Largura Superior (Grande Dorsal)', setsReps: '3 x 12', rest: 60, tip: 'Inicie o movimento abaixando os ombros e puxe a barra em direção à parte superior do peito.' },
  { id: 'b2', routine: 'B', name: 'Remada Curvada ou Cavalinho', muscle: 'Espessura e Força de Tronco', setsReps: '3 x 12', rest: 60, tip: 'Coluna neutra e peito aberto. Puxe a carga em direção ao umbigo fechando as escápulas.' },
  { id: 'b3', routine: 'B', name: 'Remada Baixa com Triângulo', muscle: 'Miolo das Costas e Postura', setsReps: '3 x 12-15', rest: 45, tip: 'Evite jogar o tronco muito para trás; puxe com os cotovelos rentes ao corpo.' },
  { id: 'b4', routine: 'B', name: 'Pullover no Cabo (Corda)', muscle: 'Dorsal Baixa e Serrátil', setsReps: '3 x 15', rest: 45, tip: 'Braços quase estendidos; leve a corda da altura do rosto até a linha das coxas usando as dorsais.' },
  { id: 'b5', routine: 'B', name: 'Crucifixo Invertido', muscle: 'Deltóide Posterior', setsReps: '3 x 15', rest: 45, tip: 'Abra os braços para trás focando na parte posterior dos ombros, sem juntar demais as escápulas.' },
  { id: 'b6', routine: 'B', name: 'Rosca Direta (Barra W)', muscle: 'Bíceps Geral (Curta e Longa)', setsReps: '3 x 12', rest: 45, tip: 'Cotovelos colados ao lado do tronco durante toda a subida e descida da barra.' },
  { id: 'b7', routine: 'B', name: 'Rosca Martelo', muscle: 'Braquial e Antebraço', setsReps: '3 x 12-15', rest: 45, tip: 'Pegada neutra (palmas voltadas uma para a outra) para dar densidade ao braço e antebraço.' },
  { id: 'b8', routine: 'B', name: 'Rosca Inclinada no Banco 45º', muscle: 'Alongamento e Pico do Bíceps', setsReps: '2 x 15', rest: 45, tip: 'Deixe os braços caírem verticalmente atrás da linha do tronco para alongamento máximo.' },
  { id: 'b9', routine: 'B', name: 'Abdominal Bicicleta / Russian Twist', muscle: 'Oblíquos (Linha Lateral)', setsReps: '3 x 20 total', rest: 45, tip: 'Gire o tronco levando o ombro em direção ao joelho oposto sem puxar o pescoço.' },
  { id: 'b10', routine: 'B', name: 'Cardio Pós-Treino (Esteira / Escada)', muscle: 'Queima Calórica e Resistência', setsReps: '20 min', rest: 0, tip: 'Mantenha ritmo constante no simulador de escada ou esteira inclinada mantendo a frequência cardíaca elevada.' },
  { id: 'c1', routine: 'C', name: 'Agachamento (Livre ou Smith)', muscle: 'Quadríceps e Glúteos', setsReps: '3 x 12', rest: 75, tip: 'Pés na largura dos ombros, joelhos acompanhando a ponta dos pés e descida controlada até 90º.' },
  { id: 'c2', routine: 'C', name: 'Leg Press 45º', muscle: 'Quadríceps e Adutores', setsReps: '3 x 12-15', rest: 60, tip: 'Não trave completamente os joelhos no topo e evite tirar o quadril/lombar do encosto na descida.' },
  { id: 'c3', routine: 'C', name: 'Stiff com Halteres ou Barra', muscle: 'Posterior de Coxa e Glúteos', setsReps: '3 x 12', rest: 60, tip: 'Joelhos semi-flexionados e fixos; empurre o quadril para trás mantendo a coluna reta.' },
  { id: 'c4', routine: 'C', name: 'Afundo / Passada com Halteres', muscle: 'Resistência Geral de Pernas e Glúteos', setsReps: '3 x 12 cada', rest: 60, tip: 'Dê um passo firme e desça o joelho de trás em direção ao chão mantendo o tronco ereto.' },
  { id: 'c5', routine: 'C', name: 'Cadeira Extensora', muscle: 'Definição do Quadríceps', setsReps: '3 x 15', rest: 45, tip: 'Segure 1 segundo no topo com os joelhos estendidos para maximizar o estímulo metabólico.' },
  { id: 'c6', routine: 'C', name: 'Mesa ou Cadeira Flexora', muscle: 'Isolamento de Posterior', setsReps: '3 x 15', rest: 45, tip: 'Mantenha o quadril pressionado contra o banco durante toda a flexão dos joelhos.' },
  { id: 'c7', routine: 'C', name: 'Panturrilha em Pé + Sentada', muscle: 'Panturrilha Completa', setsReps: '4 x 15-20', rest: 40, tip: 'Amplitude máxima: alongue bem o calcanhar embaixo e suba o máximo possível na ponta dos pés.' },
  { id: 'c8', routine: 'C', name: 'Abdominal Supra + Infra', muscle: 'Reto Abdominal Superior e Inferior', setsReps: '3 x 15 cada', rest: 45, tip: 'Combine 15 repetições de crunch supra seguidas imediatamente de 15 elevações de quadril.' },
  { id: 'c9', routine: 'C', name: 'Cardio Pós-Treino (Esteira / Bike)', muscle: 'Queima Calórica Máxima', setsReps: '25 min', rest: 0, tip: 'Finalize a semana com 25 minutos em cadência moderada-intensa para otimizar a redução abdominal.' },
]
