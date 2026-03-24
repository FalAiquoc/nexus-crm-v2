# Dockerfile para Nexus CRM v2
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do frontend e backend
# Nota: Assumindo que Vite cuida do front e temos um build para o server
RUN npm run build

# Expor porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
