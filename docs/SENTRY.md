# Sentry — bbdw-storefront

SDK `@sentry/react` inicializado antes do React. Os hooks do React 19 capturam erros de renderização; um boundary exibe recuperação sem fazer uma segunda captura. Erros globais e promises não tratadas usam as integrações do SDK. Erros HTTP tratados pela interface continuam sendo responsabilidade do serviço de origem.

A configuração mantém apenas erros nesta etapa, sem replay, profiling ou logs. Requests, usuários e breadcrumbs são removidos antes do envio; os testes verificam a ausência de cabeçalhos, query e dados sintéticos privados.

## Configuração

Copie `.env.example` para `.env` e configure o DSN do projeto próprio, ambiente, release e identificador de execução. Nunca grave `SENTRY_AUTH_TOKEN` no repositório. Sem DSN, o envio fica desativado.

Use `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE`, `VITE_DEMO_SCENARIO` e `VITE_DEMO_RUN_ID`. São valores públicos incorporados pelo Vite no build; nunca use `VITE_SENTRY_AUTH_TOKEN`. A variável `SENTRY_DSN` sem prefixo neste repo pertence ao checkout do Compose, não ao navegador.

Para mapas: `npm run build`, depois `npm run sentry:upload -- ../bbdw-storefront` no Patchwork, com `SENTRY_AUTH_TOKEN`, `SENTRY_ORG=bbdw-workshop-jj` e `SENTRY_PROJECT=bbdw-storefront` exportados. O script injeta Debug IDs e envia os mapas com `VITE_SENTRY_RELEASE`; sirva exatamente esse `dist`, sem reconstruí-lo depois. `.map` não deve ser publicado no servidor web. O Dockerfile recebe as variáveis públicas por build args e exclui mapas da imagem final; upload do build Docker não é automático e deve ser preparado no CD quando a hospedagem for definida.

O Compose usa `USERS_SENTRY_DSN` e `CATALOG_SENTRY_DSN`, com releases próprias; o checkout mantém as variáveis existentes. O frontend usa o próprio `VITE_SENTRY_DSN`. Cada DSN deve corresponder ao projeto homônimo.

O upload é mantido no [Patchwork](https://github.com/bb-dw-26/patchwork/blob/main/docs/SOURCEMAPS.md). Execute o build neste app e o comando de publicação a partir do checkout do Patchwork; ele carrega o `.env` da pasta indicada.
