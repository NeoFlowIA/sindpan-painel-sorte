# 🚀 Guia de Configuração para Produção

## ✅ **O Que Já Está Configurado**

Seu código já está preparado para produção! As configurações automáticas incluem:

- ✅ **URL Dinâmica**: Usa proxy em desenvolvimento, URL direta em produção
- ✅ **Build Scripts**: Scripts de build configurados
- ✅ **Tratamento de Erros**: CORS e outros erros tratados
- ✅ **JWT Storage**: Tokens armazenados corretamente

## 🛠️ **Como Fazer Deploy**

### **Opção 1: Build Simples (Recomendado)**

```bash
# 1. Build para produção
npm run build

# 2. Os arquivos estarão na pasta 'dist'
# 3. Faça upload da pasta 'dist' para seu servidor
```

### **Opção 2: Preview Local (Testar antes do deploy)**

```bash
# 1. Build
npm run build

# 2. Preview local da versão de produção
npm run preview

# 3. Acesse http://localhost:4173 para testar
```

## 🌐 **Configurações de Ambiente**

### **Desenvolvimento**
- URL da API: `/api` (via proxy)
- CORS: Resolvido pelo proxy do Vite

### **Produção**
- URL da API: `https://neotalks-sindpan-auth.t2wird.easypanel.host`
- CORS: A API precisa permitir seu domínio

## 🔧 **Variáveis de Ambiente (Opcional)**

Se você quiser usar uma URL de API customizada, crie um arquivo `.env.local`:

```env
# Sobrescrever URL da API (opcional)
VITE_API_BASE_URL=https://sua-api-customizada.com
```

## 📝 **Checklist para Produção**

### **Antes do Deploy:**
- [ ] Teste local com `npm run preview`
- [ ] Verifique se a API permite CORS do seu domínio
- [ ] Configure HTTPS no seu servidor (obrigatório para JWT)
- [ ] Teste login/cadastro em produção

### **Configuração do Servidor Web:**

#### **Nginx (Recomendado)**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Serve static files
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### **Apache**
```apache
<VirtualHost *:443>
    ServerName seu-dominio.com
    DocumentRoot /path/to/dist
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # SPA Routing
    <Directory /path/to/dist>
        AllowOverride All
        
        # Enable rewrite
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 🔒 **Configuração CORS na API**

**A API SINDPAN precisa adicionar estes headers para seu domínio:**

```
Access-Control-Allow-Origin: https://seu-dominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## 🧪 **Teste em Produção**

### **1. Health Check**
```bash
curl https://seu-dominio.com/api/health
# Deve redirecionar para a API e retornar: {"ok": true}
```

### **2. Teste de Cadastro**
Acesse `https://seu-dominio.com/padaria/cadastro` e teste o formulário.

### **3. Teste de Login**
Acesse `https://seu-dominio.com/padaria/login` e teste com credenciais válidas.

## 📊 **Monitoramento**

### **Logs importantes para verificar:**
1. **Console do navegador**: Erros de JavaScript
2. **Network tab**: Falhas de requisições
3. **Logs do servidor**: Erros de 404/500

### **Health Check Automático**
Seu painel já tem um componente de health check que monitora a API em tempo real.

## 🚨 **Problemas Comuns e Soluções**

### **CORS Error em Produção**
```
❌ Problema: CORS error ainda aparece
✅ Solução: Peça para o time da API adicionar seu domínio nos headers CORS
```

### **404 em Rotas SPA**
```
❌ Problema: /padaria/login retorna 404
✅ Solução: Configure servidor para servir index.html para todas as rotas
```

### **Token JWT não funciona**
```
❌ Problema: Login funciona mas perfil dá erro
✅ Solução: Verifique se está usando HTTPS (JWT requer conexão segura)
```

### **API não responde**
```
❌ Problema: Todas as requisições falham
✅ Solução: Verifique se a API está online e acessível do seu servidor
```

## 📈 **Otimizações para Produção**

### **1. Build Otimizado**
```bash
# Build com análise de bundle
npm run build -- --analyze

# Build com modo específico
npm run build -- --mode production
```

### **2. Caching**
Configure cache do navegador para assets estáticos:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **3. Compressão**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## ✅ **Conclusão**

Seu código está **100% pronto para produção**! Os principais pontos:

1. **Zero mudanças no código** necessárias
2. **URL automática** baseada no ambiente
3. **Tratamento de erros** implementado
4. **Logs apenas em desenvolvimento**

Basta fazer o build e deploy! 🚀
