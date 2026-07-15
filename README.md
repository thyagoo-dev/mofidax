# Mofidax ⚡

Mofidax é um Progressive Web App (PWA) de altíssima performance para processamento de imagens diretamente no navegador. Construído com foco absoluto em privacidade e velocidade, o sistema utiliza Web Workers e a Canvas API para realizar compressão perceptual, conversão de formatos, redimensionamento e recortes complexos sem enviar um único byte para servidores externos.

---

## 🚀 Principais Funcionalidades

O Mofidax foi desenhado para substituir ferramentas baseadas em nuvem, trazendo o poder computacional para o dispositivo do usuário (Client-Side Processing).

* **Compressão Perceptual Inteligente:** Algoritmo assíncrono que encontra o equilíbrio ideal entre peso e qualidade visual.
* **Conversão Universal:** Suporte para transcodificação instantânea entre WebP, JPEG e PNG preservando metadados quando necessário.
* **Redimensionamento Cirúrgico:** Motor de interpolação em tempo real (Live Preview) com trava de proporção (Aspect Ratio).
* **Recorte Interativo:** Interface fluida para re-enquadramento de fotografias com suporte a gestos touch.
* **Histórico de Sessão:** Sistema de cache local com visualizador integrado para resgate de arquivos processados.
* **Offline-First (PWA):** Instalação nativa em Desktop e Mobile, funcionando 100% sem conexão com a internet através de Service Workers.

---

## 🛠️ Stack Tecnológico

A arquitetura do projeto foi construída seguindo os princípios de Clean Code, SOLID e componentização estrita, garantindo máxima escalabilidade.

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Core / UI** | React 19 + TypeScript | Renderização de interface e tipagem estática rigorosa |
| **Estilização** | Tailwind CSS (v4) | Design System utility-first e responsividade Mobile-First |
| **Gerenciamento de Estado**| Zustand + Persist Middleware | Estado global escalável e persistência no LocalStorage |
| **Animações** | Framer Motion | Transições fluidas e feedback visual avançado |
| **Roteamento** | React Router DOM | Navegação Single Page Application (SPA) sem recarregamentos |
| **Processamento Base** | Web Workers + OffscreenCanvas | Paralelismo de threads para evitar congelamento da UI (Main Thread) |
| **Manipulação Visual** | React Easy Crop | Gestão matemática avançada para interações de recorte |
| **Ícones** | Lucide React | Biblioteca de vetores otimizada e consistente |

---

## 🧠 Destaques Arquiteturais

### Processamento Assíncrono (Web Workers)
Para garantir uma UI travada a 60 FPS, todo o trabalho pesado de leitura e reescrita de matrizes de pixels foi isolado da *Main Thread*. Os cálculos ocorrem em um `Worker` dedicado, comunicando-se com o React estritamente via envio de mensagens estruturadas.

### Gestão de Memória (Memory Leak Prevention)
Aplicações que manipulam `Blobs` e `ObjectURLs` nativos do navegador são propensas a vazamentos de memória. O Mofidax implementa ciclos de vida estritos (`useEffect` cleanup) e funções de revogação automática (`URL.revokeObjectURL`) para garantir que a RAM do dispositivo do usuário permaneça intacta, mesmo após horas de uso.

### Design Responsivo e UX
A interface adota a filosofia *Mobile-First*, com layouts que se transmutam (ex: modais verticais no celular e painéis laterais no desktop). O feedback de processamento, como a geração de pré-visualizações através de *Debounce* (300ms), eleva o patamar da experiência do usuário.

---

## 📦 Como Rodar o Projeto

Siga os passos abaixo para testar o Mofidax localmente na sua máquina.

1. Clone o repositório em seu ambiente:
`git clone https://github.com/SeuUsuario/Mofidax.git`

2. Acesse o diretório do projeto:
`cd Mofidax`

3. Instale todas as dependências necessárias:
`npm install`

4. Inicie o servidor de desenvolvimento Vite:
`npm run dev`

5. Abra o seu navegador no endereço indicado (geralmente `http://localhost:5174`).

---

## 🤝 Autor

Desenvolvido com foco na excelência técnica e na experiência do usuário.

**Cícero Thyago de Oliveira Fernandes**
* **Contato:** c.thyago.dev@gmail.com
* **LinkedIn:** https://www.linkedin.com/in/thyagoodev/
* **GitHub:** https://github.com/thyagoo-dev

Projeto desenvolvido com fins de resolução de problemas reais de processamento de imagens no lado do cliente.