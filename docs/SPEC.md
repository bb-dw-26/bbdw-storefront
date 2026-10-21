# Especificação de bbw-storefront

## Escopo da apresentação de 50 minutos

A apresentação tem **50 minutos** e começa com a aplicação já executando a revisão defeituosa de **CHK-001**. A primeira compra revela a falha; a meta é iniciar Sentry → issue no checkout → workflow nos primeiros **5 minutos**.

Enquanto o agente trabalha em segundo plano, apresentar a arquitetura, o YAML do workflow, o contexto do incidente e os critérios de validação. Retomar os resultados por volta do minuto 30, sem acompanhar logs continuamente. Os cerca de 25 minutos disponíveis não são garantia de conclusão.

**Prioridades:** CHK-001 é o único cenário obrigatório; CAT-001 é reserva opcional, preparada apenas depois do fluxo principal; USR-001, USR-002, CAT-002, CHK-002, WEB-001 e WEB-002 são material complementar. Nenhum cenário adicional bloqueia a entrega.

Manter quatro aplicações pequenas, dados fictícios em memória, HTTP/JSON e CI/CD próprio por repositório. Autenticação real, banco de dados, pagamentos, mensageria, reparos entre repositórios e múltiplos agentes ficam fora desta entrega.

**Papel deste repositório:** Interface saudável em uma única página: cliente, produto, quantidade, modalidade, envio e resultado. Abrir com customer-pickup, duas unidades de product-standard e pickup pré-selecionados; a primeira tentativa de finalizar revela CHK-001. Não introduzir falhas de renderização na apresentação.

[Roteiro completo e contingência](https://github.com/bbdw-gh-action/bbw-storefront/blob/main/docs/ROTEIRO.md).

## Objetivo e responsabilidade

Permitir selecionar cliente, navegar pelo catálogo, montar carrinho, escolher entrega ou retirada e visualizar o pedido.

É dona da apresentação e do estado local do carrinho. O checkout calcula os totais finais. Também abriga a composição local, o roteiro e o registro de versões de cada demonstração.

Tecnologia: React e TypeScript com Vite. Porta local proposta: `3000`. Clientes e produtos vêm de fixtures em memória. A criação do pedido retorna a confirmação sem persistência ou histórico nesta versão. Persistência durável fica fora desta primeira entrega.

## Interface e regras de negócio

| Tela ou fluxo | Comportamento esperado |
| --- | --- |
| Catálogo | Consumir `GET /products`, mostrar preço e imagem ou placeholder |
| Cliente | Selecionar `customer-pickup` ou `customer-delivery` e consultar seu perfil |
| Carrinho | Quantidades inteiras de 1 a 99; agregar adições do mesmo produto em uma linha |
| Finalização | Enviar `POST /orders`; mostrar erros 422 e 500 sem quebrar a tela, preservando o carrinho e permitindo nova tentativa manual |
| Confirmação | Exibir ID, total, modalidade e endereço somente quando for entrega |

Consumir os contratos dos três backends por HTTP/JSON, com URLs configuráveis. Os backends devem permitir a origem local configurada via CORS. Exibir moeda BRL em pt-BR; manter centavos inteiros no estado. Manter o carrinho após erro e impedir submissões simultâneas na mesma tela.

Recursos visuais de demonstração são locais. O caminho `/demo-assets/caneca.svg` do catálogo é servido pela interface. Um produto sem miniatura usa placeholder acessível. A interface não substitui as validações do servidor.

O scaffold implementa os endpoints e fluxos obrigatórios. Users e catalog carregam as fixtures versionadas; checkout e interface usam os contratos HTTP. Os endpoints marcados como complementares permanecem fora da implementação.

## Contratos comuns

- HTTP/JSON, IDs como strings, valores monetários em centavos inteiros e moeda BRL.
- Envelope de erro: `{"error":{"code":"CODIGO_ESTAVEL","message":"Mensagem legível"},"requestId":"identificador"}`.
- Propagar `X-Request-ID` nas chamadas e respostas; gerar um identificador quando ausente.
- Dados exclusivamente fictícios. Não incluir tokens, cabeçalhos de autenticação ou dados pessoais reais nos eventos.
- O checkout deve ter projeto Sentry próprio e identificar ambiente, release, serviço e cenário. Os demais serviços também possuem SDK e projetos próprios; consulte docs/SENTRY.md para as evidências.
- Contratos de erro esperados (4xx) não são falhas inesperadas por padrão. Os defeitos descritos devem gerar exceções reais, instrumentadas explicitamente.
- A implementação deve evitar captura duplicada da mesma exceção.

## Observabilidade

Para CHK-001, instrumentar o checkout, publicar source maps associados à release e comprovar o envio de uma exceção real ao Sentry. Propagar o request ID pelos serviços e evitar eventos duplicados. Testes automatizados usam clientes simulados, sem credenciais reais.

Users e catalog devem permanecer saudáveis; a interface mostra o erro retornado pelo checkout e permite repetir a mesma compra após o reparo. A instrumentação Sentry própria desses três repositórios foi autorizada e validada como suporte à demonstração.

Se CAT-001 for preparado como reserva, instrumentar a recuperação do panic HTTP no Go para capturar stack e retornar 500 sem derrubar o serviço. Essa preparação é opcional e ocorre depois da conclusão do cenário principal.

## CI/CD independente

**CI previsto:** Instalação pelo lockfile, lint, tipos, testes de componentes, build e um teste de navegador da compra principal com APIs simuladas, cobrindo erro e posterior sucesso.

**CD previsto:** Artefato próprio da interface, URLs públicas configuráveis, release e rollback próprios. Upload de source maps ao Sentry fica para a instrumentação opcional da interface. A composição local não substitui os pipelines dos serviços.

O destino de hospedagem será escolhido posteriormente. O workflow de reparo do checkout recebe o incidente CHK-001 e abre um PR no checkout. Workflows equivalentes nos outros repositórios ficam para uma etapa posterior. Os comandos estão no README e o CI em `.github/workflows/ci.yml`. Dockerfile disponível; ainda não há deploy para hospedagem configurado.

## Critérios de entrega para os 50 minutos

- Interface saudável em uma única página: cliente, produto, quantidade, modalidade, envio e resultado. Abrir com customer-pickup, duas unidades de product-standard e pickup pré-selecionados; a primeira tentativa de finalizar revela CHK-001. Não introduzir falhas de renderização na apresentação.
- Validar os contratos usados pela compra principal e os casos vizinhos necessários à correção.
- Manter build, testes e deploy independentes deste repositório.
- Ensaiar a compra com as quatro versões fixadas e registrar request ID e releases.
- Preparar um resultado anterior de CHK-001, identificado como ensaio, para a contingência.
- Documentar execução local e encerramento dos processos.

Para checkout, a entrega exige CHK-001 reproduzível, evento Sentry, issue, execução do agente, PR com teste falhando antes e passando depois e repetição da compra corrigida. Para os demais repositórios, a entrega exige suportar essa jornada de forma saudável. As soluções e falhas complementares continuam públicas para exploração posterior, sem obrigação de implementação nesta etapa.

## Instrumentação adicional autorizada

O serviço possui SDK e projeto Sentry próprio. A validação e a configuração estão em [SENTRY.md](SENTRY.md). Isso não adiciona novos cenários defeituosos à apresentação: CHK-001 continua sendo o único obrigatório.
