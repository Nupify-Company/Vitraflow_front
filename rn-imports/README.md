# VitraFlow

Protótipo de uma vitrine digital e seu painel administrativo. O projeto usa HTML5, CSS3 e JavaScript Vanilla.

## Executar

Inicie o servidor estático na pasta `rn-imports`:

```bash
python3 -m http.server 5500
```

- [Painel administrativo](http://localhost:5500/admin/)
- [Vitrine pública](http://localhost:5500/)
- [Catálogo](http://localhost:5500/catalogo.html)

Acesse painel e vitrine pelo mesmo endereço e porta para que ambos leiam os mesmos dados do navegador. As fontes são carregadas pelo Google Fonts quando há conexão. As imagens iniciais são locais.

## Dados demonstrativos

`js/mock-data.js` reúne o catálogo inicial e as configurações da vitrine. `js/store.js` centraliza a validação, a leitura e a escrita em LocalStorage. O painel atualiza o catálogo e a vitrine usa as mesmas configurações e os mesmos produtos ativos. O painel mantém suas próprias cores e fontes.

O limite inicial de estoque baixo é de três unidades por numeração. Em **Configurações** é possível alterá-lo ou restaurar todos os dados iniciais. Em **Aparência da vitrine**, a prévia exibe a própria página inicial da vitrine em larguras de desktop e celular. O rascunho aparece na prévia, e a vitrine pública muda ao salvar.

As imagens locais selecionadas no painel são convertidas em miniaturas WebP de até 640 px no maior lado. Somente essas versões reduzidas são persistidas, e URLs podem ser adicionadas diretamente. Os originais continuam no dispositivo. A sacola e os botões de compra são demonstrativos. Os dados ficam no navegador em que foram inseridos.
