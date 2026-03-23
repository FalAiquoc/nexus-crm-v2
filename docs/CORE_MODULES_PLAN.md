# Plano de Conclusão: Módulos Core (Dashboard, Kanban e Agenda)

Este documento detalha os passos técnicos e de interface necessários para levar os três principais módulos do **Central Barber / Nexus CRM** de 100% de conclusão funcional.

---

## 📊 1. Dashboard (Painel de Controle)
O Dashboard deve ser o centro de informações, agregando dados do Kanban, Agenda e Clientes.

### Passos para Conclusão:
- [ ] **Integração de Estado Global:** Conectar o Dashboard ao estado global (ou contexto) para ler dados reais de Clientes, Agendamentos e Cards do Kanban.
- [ ] **Cálculo de Métricas Dinâmicas:**
  - Total de Clientes Ativos (contagem de clientes).
  - Receita Estimada (soma do valor dos cards no Kanban em status "Ganho" ou agendamentos concluídos).
  - Taxa de Conversão (Cards Ganhos / Total de Cards).
  - Agendamentos do Dia (filtrar agenda pela data atual).
- [ ] **Implementação de Gráficos (Recharts):**
  - Instalar a biblioteca `recharts` (padrão do projeto).
  - Criar um gráfico de barras/linhas mostrando o faturamento ou número de agendamentos dos últimos 7 dias.
- [ ] **Feed de Atividades Recentes:**
  - Lista rolável mostrando as últimas ações (ex: "Novo cliente cadastrado", "Agendamento cancelado").

---

## 📋 2. Kanban (Gestão de Vendas / Funil)
O Kanban precisa ser interativo, permitindo o fluxo visual de clientes desde o primeiro contato até o fechamento.

### Passos para Conclusão:
- [ ] **Lógica de Drag and Drop (Arrastar e Soltar):**
  - Implementar a funcionalidade de arrastar cards entre as colunas (usando HTML5 DnD nativo ou biblioteca como `@hello-pangea/dnd`).
  - Atualizar o status do card no estado local/banco de dados assim que ele for solto em uma nova coluna.
- [ ] **Gerenciamento de Cards:**
  - Criar modal para adicionar um "Novo Negócio/Card" diretamente em uma coluna específica.
  - Criar modal de edição ao clicar em um card (editar valor, cliente associado, tags, descrição).
- [ ] **Filtros e Buscas:**
  - Adicionar barra de pesquisa para filtrar cards por nome do cliente ou serviço.
  - Filtro por responsável (barbeiro/atendente).
- [ ] **Cálculo de Colunas:**
  - Mostrar o valor total (R$) e a quantidade de cards no cabeçalho de cada coluna.

---

## 📅 3. Agenda (Gestão de Horários)
A Agenda é o coração operacional para barbearias e estéticas, exigindo precisão e prevenção de conflitos.

### Passos para Conclusão:
- [ ] **Visualização de Calendário:**
  - Implementar visualizações de "Dia", "Semana" e "Mês".
  - Utilizar uma biblioteca de manipulação de datas (ex: `date-fns` ou `dayjs`) para gerenciar a grade de horários.
- [ ] **Lógica de Agendamento (Modal):**
  - Criar modal de "Novo Agendamento" com os campos: Cliente (busca/select), Serviço, Profissional, Data, Hora de Início e Duração.
- [ ] **Validação de Conflitos (Crucial):**
  - Criar função que verifica se o profissional já tem um agendamento no horário selecionado antes de salvar.
- [ ] **Status do Agendamento:**
  - Adicionar mudança de status com cores visuais: Pendente (Amarelo), Confirmado (Azul), Concluído (Verde), Cancelado/Faltou (Vermelho).
- [ ] **Integração com WhatsApp (Opcional/Futuro):**
  - Botão no card do agendamento para abrir o WhatsApp Web com uma mensagem pré-formatada de lembrete para o cliente.

---

## 🚀 Próxima Ação Sugerida
Para manter o desenvolvimento ágil, sugere-se atacar um módulo por vez, começando pela lógica de estado (React Context ou Zustand) para que os três módulos possam compartilhar os mesmos dados antes de conectar ao backend definitivo.
