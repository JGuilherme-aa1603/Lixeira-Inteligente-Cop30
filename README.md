# Lixeira Inteligente ♻️

Este é um app inteligente para ajudar você a descartar resíduos corretamente, usando inteligência artificial (OpenAI GPT-4o) para identificar o tipo de lixo a partir de texto ou imagem.

## Como funciona?
- Envie uma foto ou digite o nome do resíduo.
- A IA retorna um emoji, a categoria, instrução de descarte e a cor da lixeira correta, tudo de forma compacta e amigável.

## Principais recursos
- Reconhecimento de resíduos por texto ou imagem (GPT-4o)
- Resposta direta: emoji, categoria, instrução e cor da lixeira
- Interface simples, rápida e responsiva
- Sem dependências externas de classificação (ex: Imagga)

## Como rodar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Adicione sua chave da OpenAI no arquivo `openai.config.js` (este arquivo está no .gitignore por segurança).

3. Inicie o app:
   ```bash
   npx expo start
   ```

## Futuras melhorias
- Histórico de consultas
- Compartilhamento
- Reconhecimento por voz
- Pontos de coleta próximos
- Gamificação e feedback

---

Desenvolvido para facilitar o descarte consciente e sustentável! 🌱
