# Dockerfile para Nexus CRM v2 (Homologado para Node.js v18)
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências ignorando lockfiles desatualizados
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build do frontend (Vite) e backend (Server)
RUN npm run build

# Opcional: remover as devDependencies após o build para diminuir o tamanho da imagem
# RUN npm prune --production

# Expor porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor a partir da pasta compilada
CMD ["npm", "start"]
