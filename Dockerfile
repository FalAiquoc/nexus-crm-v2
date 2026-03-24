# Dockerfile para Nexus CRM v2 (Homologado para Node.js v18)
FROM node:18-alpine

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS a dependências ignorando lockfiles desatualizados (inclui Vite/TypeScript)
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build do frontend (Vite) e backend (Server) - PRECISA das devDependencies
RUN npm run build

# Opcional: remover as devDependencies após o build para diminuir o tamanho da imagem
# Usar legacy-peer-deps para nao quebrar a arvore neste estagio
RUN npm prune --production --legacy-peer-deps

# SÓ AGORA definimos variáveis de ambiente como produção (para node rodar otimizado)
ENV NODE_ENV=production

# Expor porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor a partir da pasta compilada
CMD ["npm", "start"]
