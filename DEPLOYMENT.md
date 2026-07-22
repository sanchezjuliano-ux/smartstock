# Guia de Deploy - Despensa Virtual (Next.js)

Este projeto foi construído em Next.js 15 e está pronto para produção.

---

## 📱 Teste Imediato no Celular (Sem precisar de deploy extra)

Você pode testar o aplicativo **agora mesmo** no seu celular ou enviar o link diretamente para clientes usando a URL pública do projeto:

👉 **URL de Demonstração Live:**  
`https://ais-pre-6syg75wed533yskukupw2l-144259058886.us-west2.run.app`

*(Você também pode usar o botão **Share** no topo do painel do AI Studio para gerar novos links públicos).*

---

## 🚀 Plataforma Recomendada para Produção: **Vercel**

A **Vercel** é a plataforma mantenedora do Next.js. É a opção mais rápida, 100% gratuita no plano Hobby, com suporte nativo a API Routes e deploy com zero configuração.

### Opção 1: Deploy via Vercel CLI (Mais rápido via Terminal)

1. Instale a CLI da Vercel globalmente:
   ```bash
   npm install -g vercel
   ```

2. Faça login na sua conta Vercel:
   ```bash
   vercel login
   ```

3. Execute o comando de deploy no diretório do projeto:
   ```bash
   vercel
   ```

4. Para publicar diretamente no ambiente de produção:
   ```bash
   vercel --prod
   ```

---

### Opção 2: Deploy via GitHub + Vercel (Recomendado para atualizações contínuas)

1. Exporte ou envie este código para um repositório no seu **GitHub** (utilize o menu **Settings / Export** do AI Studio ou `git push`).
2. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
3. Clique em **"Add New Project"** e selecione o repositório.
4. Defina as **Variáveis de Ambiente** no painel da Vercel antes de clicar em Deploy:

#### 🔑 Variáveis de Ambiente Necessárias no Painel da Vercel:

| Nome da Variável | Valor Recomendado |
| --- | --- |
| `GEMINI_API_KEY` | *(Sua chave da API Gemini)* |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `gen-lang-client-0100523234` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:521121890018:web:4dbd916a1724412dd3a8bb` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCN5ikzx7jPmJdY-7M6uymP6CV0y_XNMOA` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `gen-lang-client-0100523234.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_ID` | `ai-studio-smartstock-f9073769-f417-42a0-89bc-9e7408004e0e` |

5. Clique em **Deploy**. Seu app estará no ar com HTTPS em menos de 2 minutos!

---

## 🔥 Opção Alternativa: Firebase Hosting

Caso prefira manter o hosting dentro da estrutura do Google Cloud / Firebase:

1. Instale as ferramentas do Firebase:
   ```bash
   npm install -g firebase-tools
   ```

2. Faça login:
   ```bash
   firebase login
   ```

3. Inicialize o Firebase Hosting com suporte a Next.js (Web Frameworks):
   ```bash
   firebase init hosting
   ```
   *(Responda `Yes` para detecção automática de Next.js).*

4. Execute o deploy:
   ```bash
   firebase deploy --only hosting
   ```
