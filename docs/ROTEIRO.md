# Roteiro da apresentação

## Preparação

Registrar os commits e as imagens dos quatro serviços. Preparar os dados fictícios, as URLs de demonstração, os projetos Sentry e as permissões do GitHub. A composição local será adicionada nesta aplicação; cada serviço terá seu próprio deploy.

## Sequência principal

1. Mostrar uma compra saudável.
2. Implantar a revisão de CHK-001, mantendo os demais serviços saudáveis.
3. Selecionar customer-pickup e duas unidades de product-standard; escolher retirada.
4. Mostrar a falha e o evento no Sentry, com release e request ID.
5. Acompanhar a criação da issue e a execução do agente no GitHub Actions.
6. Examinar diagnóstico, teste de regressão e correção no PR.
7. Revisar, implantar a correção e repetir a compra de R$ 80,00.
8. Mostrar o registro de avaliação, incluindo uso de soluções públicas.

## Segunda linguagem

Executar CAT-001 diretamente contra o catálogo Go com product-no-image. Isso permite comparar o mesmo processo com runtime, stack trace e ferramentas de teste diferentes.

## Falhas da interface

Executar WEB-001 e WEB-002 com respostas saudáveis dos backends. Fixtures ou APIs simuladas permitem reproduzir as falhas de interface sem depender de uma falha no checkout ou catálogo.

## Encerramento

Registrar evidências, preservar PRs e revisões e encerrar os processos iniciados. Para uma nova tentativa, partir novamente do commit defeituoso em uma nova branch.

## Contingência

Preparar uma execução anterior completa, claramente identificada como gravação ou histórico, para o caso de indisponibilidade de rede ou demora do agente. Medir o tempo dos ensaios antes de definir a duração da apresentação.
