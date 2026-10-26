---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-storefront usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e investigue o incidente recebido. O escopo autorizado de produção é `src/App.tsx`, `src/CheckoutPanel.tsx`, `src/api.ts`; acrescente casos de regressão nos arquivos permitidos por `testPattern`. Prefira acrescentar à suíte existente, preservando suas linhas. Arquivos novos, quando necessários, devem ter nomes do comportamento testado, sem prefixo do agente ou ID de cenário. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use Playwright com APIs interceptadas e verifique o comportamento observável da interface. O webServer do playwright.config.ts inicia e encerra o Vite; não dependa dos outros três serviços.

Comandos de verificação: npm run typecheck; npx playwright test tests/<arquivo>.spec.ts --workers=1 --retries=0; npm run check. Execute primeiro o teste novo contra o código original e registre a falha funcional. Depois aplique a correção e execute as verificações completas. Não substitua testes por alterações em fixtures ou na telemetria.

Use o MCP `sentry` para o projeto de origem validado no prompt (que pode ser de outro serviço em um encaminhamento); consulte o evento e a release informados. Não exija um evento do frontend para investigar seu código. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow junto com esta pasta.

Corrija somente o incidente recebido e encerre processos de teste iniciados.
