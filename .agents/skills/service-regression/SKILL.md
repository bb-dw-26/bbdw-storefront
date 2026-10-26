---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-storefront usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e investigue o incidente recebido. O escopo autorizado de produção é `src/App.tsx`, `src/CheckoutPanel.tsx`, `src/api.ts`; acrescente casos de regressão nos arquivos permitidos por `testPattern`. Prefira acrescentar à suíte existente, preservando suas linhas. Arquivos novos, quando necessários, devem ter nomes do comportamento testado, sem prefixo do agente ou ID de cenário. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use Playwright com APIs interceptadas e verifique o comportamento observável da interface. O webServer do playwright.config.ts inicia e encerra o Vite; não dependa dos outros três serviços.

Para concorrência, retenha a resposta interceptada, aguarde além de uma janela curta de debounce e tente a interação enquanto a primeira operação continua pendente. Confira que a ação permanece bloqueada e que houve uma única requisição, depois libere a resposta. Acrescente esse comportamento ao teste pertinente da suíte existente.

Acrescente uma regressão pertinente e aplique a correção mínima. O workflow executa npm run check uma vez após a resposta do Copilot; não repita a suíte completa durante a investigação nem produza prova automatizada antes/depois. Preserve fixtures, testes e telemetria.

Use o MCP `sentry` para o projeto de origem indicado no prompt (que pode ser de outro serviço em um encaminhamento); consulte o incidente e a release relevante ao diagnóstico. Não exija um evento do frontend para investigar seu código. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow no diretório de skills do Copilot.

Corrija somente o incidente recebido e encerre processos de teste iniciados.
