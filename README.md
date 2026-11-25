# VitraFlow — Protótipo para a RN Imports

[Acessar a demonstração na Vercel](https://vitraflowfront-rn-imports.vercel.app/)

O VitraFlow é um **protótipo de apresentação para a RN Imports**. Ele permite que o cliente navegue pela vitrine e pelo painel administrativo, avalie os principais fluxos e dê feedback. Essa validação serve para alinhar o escopo antes de iniciar o desenvolvimento da versão definitiva.

## O que a demonstração inclui

- **Vitrine** com catálogo, páginas de produto e sacola demonstrativa.
- **Painel administrativo** com cadastro de produtos, controle de estoque, visão financeira e personalização da vitrine.

O protótipo usa HTML, CSS e JavaScript puro. O login é simulado, as compras são demonstrativas e as alterações ficam no armazenamento local do navegador (`localStorage`). A versão definitiva será desenvolvida após a validação com o cliente.

## Rodar localmente

Na raiz do repositório, execute o comando abaixo com Python 3.

```bash
python3 -m http.server 5500 --directory 'protótipo'
```

- [Vitrine local](http://localhost:5500/)
- [Painel administrativo local](http://localhost:5500/admin/)

Use o mesmo endereço e a mesma porta para a vitrine e o painel compartilharem os dados de demonstração.

## Publicação na Vercel

Na Vercel, a raiz do projeto deve apontar para a raiz do repositório. O arquivo `vercel.json` publica a pasta `protótipo/` como site estático, sem etapa de instalação ou build.
