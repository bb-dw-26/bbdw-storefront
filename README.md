# bbdw-storefront

Interface de loja em React e TypeScript com Vite. Permite navegar pelo catálogo, montar carrinho, escolher entrega ou retirada e visualizar o pedido.

## Experiência da loja

A loja apresenta o catálogo em uma coluna e abre o checkout pelo botão **Carrinho**, em um painel lateral sobreposto. No celular, o painel ocupa a tela inteira. O carrinho começa com duas unidades de `product-standard` e retirada selecionada.

No painel é possível alterar quantidades, remover produtos, preencher endereço e escolher retirada ou entrega. Pix e cartão de teste são opções apenas demonstrativas: não coletam dados bancários, não processam pagamentos e não alteram o contrato HTTP ou o total. O pedido continua sendo criado pela API do checkout.

Fechar o painel preserva escolhas, erros e resultados, inclusive durante o envio. Após o sucesso, **Continuar comprando** limpa a compra concluída e retorna ao catálogo. Enquanto a confirmação não for concluída por essa ação, o catálogo mantém as adições bloqueadas para preservar o pedido exibido.

## Executar localmente

Pré-requisito: Node.js 24 e npm. Instale as dependências e inicie o modo de desenvolvimento:

```sh
npm ci
npm run dev
```

Porta padrão: **3000**. Os valores locais já funcionam por padrão. Para personalizar, copie `.env.example` para `.env` e ajuste as URLs/porta.

```sh
npm run check
```

Antes do primeiro teste de navegador, execute `npx playwright install chromium`. O teste inicia seu próprio Vite e o encerra ao finalizar; mantenha a porta 3100 livre.

Encerre o processo com **Ctrl+C** ao terminar. Cada aplicação tem seu próprio lockfile ou módulo Go, testes e workflow em `.github/workflows/ci.yml`. O CI também constrói a imagem; a publicação e o deploy serão configurados quando a hospedagem for escolhida.

Para iniciar as três aplicações juntas, consulte [execução integrada](https://github.com/bbdw-gh-action/bbdw-storefront/blob/main/docs/EXECUCAO.md).

## Documentação

- [Especificação funcional e técnica](docs/SPEC.md)

## Outros repositórios

- [bbdw-catalog](https://github.com/bbdw-gh-action/bbdw-catalog)
- [bbdw-checkout](https://github.com/bbdw-gh-action/bbdw-checkout)

## Monitoramento Sentry

SDK configurado no projeto próprio `bbdw-storefront`, com SDK de captura. Consulte [configuração](docs/SENTRY.md).

## Automação compartilhada

Integração com o Patchwork configurada no workflow local. Consulte [operação, skills e MCP](docs/PATCHWORK.md).
