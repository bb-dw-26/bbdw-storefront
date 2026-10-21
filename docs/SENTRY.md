# Sentry — bbw-storefront

Organização: `bbdw-workshop`. Projeto: `bbw-storefront`. Repositório vinculado: `bbdw-gh-action/bbw-storefront`.

SDK `@sentry/react` inicializado antes do React. Os hooks do React 19 capturam erros de renderização; um boundary exibe recuperação sem fazer uma segunda captura. Erros globais e promises não tratadas usam as integrações do SDK. Erros HTTP tratados pela interface continuam sendo responsabilidade do serviço de origem.

A configuração mantém apenas erros nesta etapa, sem replay, profiling ou logs. Requests, usuários e breadcrumbs são removidos antes do envio; os testes verificam a ausência de cabeçalhos, query e dados sintéticos privados.

## Configuração

Copie `.env.example` para `.env` e configure o DSN do projeto próprio, ambiente, release e identificador de execução. Nunca grave `SENTRY_AUTH_TOKEN` no repositório. Sem DSN, o envio fica desativado.

Use `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE`, `VITE_DEMO_SCENARIO` e `VITE_DEMO_RUN_ID`. São valores públicos incorporados pelo Vite no build; nunca use `VITE_SENTRY_AUTH_TOKEN`. A variável `SENTRY_DSN` sem prefixo neste repo pertence ao checkout do Compose, não ao navegador.

Para mapas: `npm run build`, depois `npm run sentry:upload`, com `SENTRY_AUTH_TOKEN`, `SENTRY_ORG=bbdw-workshop` e `SENTRY_PROJECT=bbw-storefront` exportados. O script injeta Debug IDs e envia os mapas com `VITE_SENTRY_RELEASE`; sirva exatamente esse `dist`, sem reconstruí-lo depois. `.map` não deve ser publicado no servidor web. O Dockerfile recebe as variáveis públicas por build args e exclui mapas da imagem final; upload do build Docker não é automático e deve ser preparado no CD quando a hospedagem for definida.

O Compose usa `USERS_SENTRY_DSN` e `CATALOG_SENTRY_DSN`, com releases próprias; o checkout mantém as variáveis existentes. O frontend usa o próprio `VITE_SENTRY_DSN`. Cada DSN deve corresponder ao projeto homônimo.

## Validação real — 21/10/2026

- Evento: [Error: BBW SDK validation storefront sdk-20261021-110837](https://bbdw-workshop.sentry.io/issues/7804712407/).
- ID: `cc150b88cb23496797591a875c8cf4ed`.
- Release exclusiva de teste: `bbw-storefront@sdk-20261021-110837`; ambiente `bbw-sdk-validation`, cenário `SDK-SMOKE`.
- Um evento observado no projeto correto, sem erros de processamento do Sentry.
- Stack: `main.tsx:8`; `App.tsx:13`; `App.tsx:13`.
- A falha foi introduzida somente em uma cópia temporária da aplicação e percorreu a inicialização real e o tratamento de erros. Nenhuma rota ou falha de teste foi adicionada à aplicação versionada.
- Os processos temporários foram encerrados. Este registro não representa deploy remoto nem execução do agente de reparo.

## Checks

`npm run check`: lint, tipos, build e dois testes Playwright. O teste de telemetria provoca uma falha real de renderização com resposta de catálogo inválida, verifica evento único, ausência de dados HTTP e botão de recuperação. O teste de compra confirma preservação do carrinho e sucesso na nova tentativa. Source maps confirmados com contexto TSX no evento do build minificado.
