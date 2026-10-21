---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-storefront usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e `docs/FALHAS.md`. O escopo autorizado de produção é `src/App.tsx`, `src/api.ts`; adicione testes novos que correspondam a `^tests/patchwork-[a-z0-9-]+\.spec\.ts$`. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use Playwright com APIs interceptadas. Preserve carrinho após erro, impeça submissões simultâneas, mostre placeholder sem miniatura e endereço somente para entrega. O webServer do playwright.config.ts inicia e encerra o Vite; não dependa dos outros três serviços.

Comandos de verificação: npm run typecheck; npx playwright test tests/patchwork-<nome>.spec.ts --workers=1 --retries=0; npm run check. Execute primeiro o teste novo contra o código original e registre a falha funcional. Depois aplique a correção e execute as verificações completas. Não substitua testes por alterações em fixtures ou na telemetria.

Use o MCP `sentry` para o projeto `bbdw-storefront` da organização `bbdw-workshop-jj`; consulte o evento e a release informados no prompt. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow junto com esta pasta.

As falhas planejadas na documentação não autorizam introduzir defeitos na aplicação. Corrija somente o incidente recebido. Relate se consultou `docs/SOLUCOES.md` e encerre processos de teste iniciados.
