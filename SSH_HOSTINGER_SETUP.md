# Guia Completo: Configuração de Acesso SSH no Servidor Hostinger

Este guia passo a passo ensina como configurar o acesso SSH ao seu servidor Hostinger para hospedar o projeto **nexus-crm-v2** via Dokploy.

---

## 1. Como Acessar o Painel Hostinger

1. Acesse o site oficial: **[https://www.hostinger.com.br](https://www.hostinger.com.br)**
2. Clique em **"Login"** no canto superior direito
3. Entre com suas credenciais (e-mail e senha)
4. No painel administrativo, selecione **"Hospedagem"** no menu lateral
5. Clique no plano de hospedagem que deseja configurar

> **Nota:** O painel pode variar slightly dependendo do plano (hPanel básico vs hPanel profissional)

---

## 2. Onde Encontrar as Opções de SSH/Terminal

### Para Hospedagem Compartilhada (Básica/Plus):

1. Após selecionar o plano de hospedagem, localize a seção **"Avançado"** no menu lateral
2. Clique em **"Terminal SSH"** ou **"Acesso SSH"**

### Para VPS/Servidor Dedicado:

1. No menu lateral, vá até **"Servidores"** ou **"VPS"**
2. Selecione seu servidor
3. Procure a opção **"SSH Keys"** ou **"Acesso Remoto"** no painel de controle do servidor

---

## 3. Como Gerar ou Adicionar Chave SSH

### Opção A: Gerar Chave SSH no Painel Hostinger

1. Acesse a seção **"Terminal SSH"** ou **"SSH Keys"**
2. Clique em **"Gerar Nova Chave SSH"**
3. Defina um nome para a chave (ex: `nexus-crm-v2`)
4. Clique em **"Gerar"**
5. A chave pública será exibida — **copie e salve em local seguro**
6. Ative a chave clicando no botão **"Ativar"** ou **"Adicionar"**

### Opção B: Adicionar Sua Própria Chave SSH

Se você já possui uma chave SSH gerada localmente:

#### No Windows (PowerShell ou Git Bash):

```powershell
# Gere a chave se não tiver
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copie o conteúdo da chave pública
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

#### No Linux/macOS:

```bash
# Gere a chave se não tiver
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copie o conteúdo da chave pública
cat ~/.ssh/id_ed25519.pub
```

#### No Painel Hostinger:

1. Vá para **"SSH Keys"** ou **"Terminal SSH"**
2. Clique em **"Adicionar Chave SSH"** ou **"Importar Chave"**
3. Dê um nome para a chave
4. Cole o conteúdo da chave pública (começa com `ssh-ed25519` ou `ssh-rsa`)
5. Clique em **"Salvar"** ou **"Adicionar"**

---

## 4. Como Obter as Credenciais de Conexão

### Informações Disponível no Painel Hostinger:

1. Na seção **"Informações do Servidor"** ou **"Detalhes da Conta"**, procure:
   - **Host/Endereço do Servidor:** Geralmente algo como `ssh.hostinger.com` ou seu domínio
   - **Porta SSH:** Padrão `22` (ou `2222` para hospedagem compartilhada)
   - **Usuário SSH:** Geralmente seu usuário Hostinger ou o username criado

### Estrutura típica:

```
Host: 72.61.222.243
Porta: 22
Usuário: root
Autenticação: SSH Key (id_ed25519)
URL Dokploy: http://72.61.222.243:3000
```

> **Importante:** Para hospedagem compartilhada Hostinger, frequentemente a autenticação é por senha, não por chave SSH. Para VPS, use autenticação por chave.

---

## 5. Como Testar a Conexão SSH

### Usando PowerShell (Windows):

```powershell
# Testar conexão com senha (hospedagem compartilhada)
ssh usuario@ssh.hostinger.com -p 2222

# Testar conexão com chave SSH (VPS)
ssh -i ~/.ssh/id_ed25519 usuario@ssh.hostinger.com -p 22
```

### Usando Git Bash / Linux / macOS:

```bash
# Conexão básica
ssh usuario@ssh.hostinger.com -p 2222

# Com chave SSH específica
ssh -i ~/.ssh/id_ed25519 -p 22 usuario@seu-servidor.com
```

### Usando PuTTY (Windows):

1. Baixe o PuTTY em **[https://www.putty.org](https://www.putty.org)**
2. Em **"Session"**:
   - Host Name: `ssh.hostinger.com` ou seu domínio
   - Port: `2222` (compartilhada) ou `22` (VPS)
   - Connection Type: SSH
3. Em **"SSH" > "Auth"**:
   - Clique em "Browse" e selecione sua private key (.ppk)
4. Clique em **"Open"**

### Verificando Conexão bem-sucedida:

Ao conectar com sucesso, você verá:
- Prompt do terminal do servidor (ex: `[usuario@servidor ~]$`)
- Mensagem de boas-vindas do servidor

---

## 6. Possíveis Erros Comuns e Soluções

### ❌ Erro: "Connection refused"

**Causa:** Porta incorreta ou servidor SSH não está ativo

**Solução:**
- Verifique se a porta está correta (2222 para compartilhada, 22 para VPS)
- Confirme se o SSH está habilitado no painel Hostinger
- Aguarde alguns minutos após ativar o SSH no painel

### ❌ Erro: "Permission denied (publickey)"

**Causa:** Chave SSH não adicionada corretamente

**Solução:**
- Verifique se a chave pública foi adicionada no painel
- Confirme que está usando a chave privada correta localmente
- No Windows, use o agent SSH: `ssh-add ~/.ssh/id_ed25519`

### ❌ Erro: "Host key verification failed"

**Causa:** O servidor foi reformado e a chave do host mudou

**Solução:**
```powershell
# Remova a chave antiga do known_hosts
ssh-keygen -R ssh.hostinger.com

# Ou edite manualmente o arquivo
notepad C:\Users\SeuUsuario\.ssh\known_hosts
```

### ❌ Erro: "Connection timed out"

**Causa:** Firewall bloqueando ou servidor indisponível

**Solução:**
- Verifique se seu IP não está bloqueado
- Tente acessar via outro réseau (ex: celular)
- Entre em contato com o suporte Hostinger

### ❌ Erro: "Bad packet length"

**Causa:** Versão do protocolo SSH incompatível

**Solução:**
- Use PuTTY versão mais recente
- Ou especifique o protocolo: `ssh -2 usuario@host`

### ❌ Erro: "Too many authentication failures"

**Causa:** Muitas tentativas com chaves erradas

**Solução:**
```powershell
# Especifique qual chave usar
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes usuario@host
```

---

## Checklist de Configuração SSH

- [ ] Acessar painel Hostinger
- [ ] Navegar até seção SSH/Terminal
- [ ] Gerar ou adicionar chave SSH pública
- [ ] Obter credenciais (host, porta, usuário)
- [ ] Testar conexão SSH
- [ ] Resolver erros (se houver)
- [ ] Configurar Dokploy com credenciais SSH

---

## Comandos Úteis Pós-Conectado

```bash
# Verificar versão do Ubuntu
cat /etc/lsb-release

# Verificar recursos disponíveis
free -h
df -h
nproc

# Atualizar servidor
sudo apt update && sudo apt upgrade -y

# Instalar Docker (se necessário)
curl -fsSL https://get.docker.com | sh
```

---

*Documento gerado para configuração do projeto nexus-crm-v2 no servidor Hostinger via Dokploy*
