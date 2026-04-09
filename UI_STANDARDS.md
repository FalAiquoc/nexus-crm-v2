# Nexus CRM v2 - UI Design System (Premium)

## Executive Perspective Layout (DoBoy V2)
Este é o padrão ouro de visualização de dados para o CRM, otimizado para决策 (decisão) rápida.

### 1. Sistema de Contextos (Tabs)
- **Localização**: Topo do Dashboard.
- **Estilo**: Botões com fundo `bg-bg-main`, bordas `border-border-color` e hover com `text-primary`.
- **Lógicas**: Visão Geral, Receita & Metas, Funil de Vendas, Canais & ROI.

### 2. KPIs Compactos
- **Grid**: 6 colunas em telas grandes.
- **Elementos**: Ícone discreto, número em destaque médio, badge de tendência (%).

### 3. Chart Design: The "Executive Ring"
- **Componente**: `PieChart` do Recharts.
- **Configuração Ótima**:
  - `innerRadius`: 70-80
  - `outerRadius`: 100-110
  - `paddingAngle`: 8 (o segredo do visual limpo entre as fatias)
  - `strokeWidth`: 0
- **HUD Central**: Texto `absolute` centralizado com `z-index` controlado.

### 4. Cores Primárias (HSL)
- **Status Ativo**: #B3924B (Gold DoBoy)
- **Background**: #0A0A0F
- **Sidebar/Cards**: #12121A
