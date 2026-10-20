# Especificação de bbw-storefront

## Objetivo e responsabilidade

Permitir selecionar cliente, navegar pelo catálogo, montar carrinho, escolher entrega ou retirada e visualizar o pedido.

É dona da apresentação e do estado local do carrinho. O checkout calcula os totais finais. Também abriga a composição local, o roteiro e o registro de versões de cada demonstração.

Tecnologia: React e TypeScript; ferramenta de build a definir. Porta local proposta: `3000`. O armazenamento inicial, quando necessário, é em memória, recriado a partir de fixtures em cada inicialização. Persistência durável fica fora desta primeira entrega.

## Interface e regras de negócio

| Tela ou fluxo | Comportamento esperado |
| --- | --- |
| Catálogo | Consumir `GET /products`, mostrar preço e imagem ou placeholder |
| Cliente | Selecionar `customer-pickup` ou `customer-delivery` e consultar seu perfil |
| Carrinho | Quantidades inteiras de 1 a 99; agregar adições do mesmo produto em uma linha |
| Finalização | Enviar `POST /orders`; informar erros 422 sem quebrar a tela |
| Confirmação | Exibir ID, total, modalidade e endereço somente quando for entrega |

Consumir os contratos dos três backends por HTTP/JSON, com URLs configuráveis. Os backends devem permitir a origem local configurada via CORS. Exibir moeda BRL em pt-BR; manter centavos inteiros no estado. Manter o carrinho após erro e impedir submissões simultâneas na mesma tela.

Recursos visuais de demonstração são locais. O caminho `/demo-assets/caneca.svg` do catálogo é servido pela interface. Um produto sem miniatura usa placeholder acessível. A interface não substitui as validações do servidor.

As fixtures em `specs/fixtures.json` são dados de entrada para implementação e testes, não endpoints já disponíveis.

## Contratos comuns

- HTTP/JSON, IDs como strings, valores monetários em centavos inteiros e moeda BRL.
- Envelope de erro: `{"error":{"code":"CODIGO_ESTAVEL","message":"Mensagem legível"},"requestId":"identificador"}`.
- Propagar `X-Request-ID` nas chamadas e respostas; gerar um identificador quando ausente.
- Dados exclusivamente fictícios. Não incluir tokens, cabeçalhos de autenticação ou dados pessoais reais nos eventos.
- Cada aplicação usa seu próprio projeto Sentry e identifica ambiente, release, serviço e cenário de ensaio.
- Contratos de erro esperados (4xx) não são falhas inesperadas por padrão. Os defeitos descritos devem gerar exceções reais, instrumentadas explicitamente.
- A implementação deve evitar captura duplicada da mesma exceção.

## Observabilidade

Inicializar o SDK apropriado antes da aplicação. Em TypeScript, publicar source maps associados à release. Em Go, capturar panics no limite HTTP, registrar a stack e retornar 500 sem derrubar o serviço; não presumir que a recuperação padrão de net/http envia eventos ao Sentry. No React, conectar o limite de erro ao SDK.

Correlacionar a requisição com a release e o cenário. Verificar a entrega do evento em ensaio real, aguardando a ingestão. Testes unitários não devem depender de Sentry ou credenciais reais.


## CI/CD independente

**CI previsto:** Instalação pelo lockfile, lint, tipos, testes de componentes, build e testes de navegador dos fluxos críticos com APIs simuladas.

**CD previsto:** Artefato próprio da interface, URLs públicas configuráveis, release, source maps e rollback próprios. A composição local não substitui os pipelines dos serviços.

O destino de hospedagem será escolhido posteriormente. O workflow de reparo recebe contexto do incidente, trabalha neste repositório e abre um PR. Os comandos de instalação e verificação serão adicionados junto à implementação; não há workflow de deploy executável nesta etapa.

## Critérios de entrega

- Implementar o caminho saudável de acordo com este contrato.
- Criar testes dos comportamentos esperados, incluindo entradas inválidas.
- Instrumentar falhas inesperadas e comprovar captura em um ambiente de demonstração.
- Implementar cenários isolados conforme `FALHAS.md`, preservando revisões reproduzíveis.
- Executar CI com ferramentas próprias desta tecnologia.
- Documentar execução local, configuração e encerramento de processos.
