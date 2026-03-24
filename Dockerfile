FROM node:22-bullseye-slim

# Instalar dependências de build no Debian
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Definir variáveis de ambiente
ENV NODE_ENV=production

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS as dependências (para o build do Vite funcionar)
RUN npm ci

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
