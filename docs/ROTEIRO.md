# Roteiro da apresentação de 50 minutos

## Narrativa e escopo

Começar com a aplicação já com o defeito CHK-001 implantado. A primeira tentativa de compra revela o problema e dispara o fluxo Sentry → issue → GitHub Actions. Enquanto o agente trabalha em segundo plano, explicar a solução; retornar depois ao diagnóstico, PR e testes.

O único cenário obrigatório é **CHK-001: retirada sem endereço**, no checkout NestJS. Users, catálogo Go e interface React permanecem saudáveis. O catálogo já demonstra a diversidade de tecnologias sem exigir um segundo reparo. CAT-001 é reserva opcional; os outros seis casos são material complementar.

## Preparação antes da sessão

- Fixar commits e imagens das quatro aplicações. Implantar antecipadamente a revisão defeituosa de CHK-001; a mudança para essa revisão não faz parte do palco.
- Preparar os dados fictícios e a interface com `customer-pickup`, duas unidades de `product-standard` e modalidade `pickup` pré-selecionados.
- Conferir a saúde dos serviços sem disparar a compra defeituosa. Garantir que um alerta do ensaio não impeça a nova execução; verificar agrupamento, deduplicação e elegibilidade do evento antes da sessão.
- Ensaiar a criação da issue e o início do agente na branch correta, a coleta de evidências, a revisão e o deploy apenas do checkout.
- Deixar abertas as abas da aplicação, Sentry, GitHub Issues e Actions. Preparar os trechos de arquitetura, YAML e instruções do agente que serão explicados.
- Ter um PR concluído de CHK-001, logs de teste e versão corrigida de um ensaio como contingência. Registrar os links e as revisões; identificar esse material como ensaio ao utilizá-lo.

## Agenda

| Minutos | Apresentação | Execução em segundo plano |
| --- | --- | --- |
| 0–5 | Finalizar a compra; mostrar o erro, o evento Sentry, a issue e o workflow iniciado | Agente começa a investigar CHK-001 |
| 5–15 | Explicar aplicação, quatro repositórios e comunicação HTTP | Reprodução e diagnóstico |
| 15–30 | Mostrar o YAML, o contexto da issue, as instruções, os testes e o CI/CD independente | Tentativa de correção e abertura do PR |
| 30–40 | Retomar os resultados: causa, diff, teste de regressão e checks | Eventuais verificações finais |
| 40–45 | Após revisão e checks aprovados, aplicar a correção e repetir a mesma compra | Deploy independente do checkout |
| 45–50 | Perguntas, fechamento e margem para imprevistos | Sem iniciar outro cenário |

São cerca de 25 minutos para o agente trabalhar entre o disparo e o bloco de resultados. Esse intervalo é uma janela de apresentação, não uma promessa de duração. Não acompanhar logs continuamente nem deixar a plateia esperando pelo agente.

## Abertura de 0 a 5 minutos

1. Explicar brevemente: “Este cliente quer retirar a compra, mas a finalização está falhando.”
2. Enviar a compra já preparada. Mostrar a mensagem de falha sem perder o carrinho.
3. No Sentry, mostrar exceção, release, request ID e contexto.
4. No GitHub, mostrar a issue no checkout e confirmar o início do workflow.
5. Seguir para a arquitetura assim que o fluxo estiver iniciado. Se alguma etapa não responder dentro do bloco, usar as evidências do ensaio para explicar a cadeia e seguir a agenda.

## Conteúdo enquanto o agente trabalha

- Responsabilidade de cada aplicação e motivo de CI/CD próprio.
- Caminho do erro até a issue e dados recebidos pelo agente.
- Instruções para reproduzir, corrigir, testar e abrir um PR.
- Diferença entre gerar uma proposta e aprovar/deployar uma mudança.
- Evidências esperadas: falha reproduzida, teste que falha antes e passa depois, preservação dos casos de entrega.

Usar o YAML e a issue como material de explicação. Não realizar outra alteração defeituosa ao vivo.

## Resultado e repetição

Mostrar o PR de CHK-001: acesso indevido ao endereço, correção condicionada à modalidade e regressão. Verificar também que entrega sem endereço retorna 422 e entrega com endereço continua válida.

Após revisão e checks aprovados, implantar somente o checkout corrigido. Repetir a requisição original: `customer-pickup`, duas unidades de `product-standard`, `pickup`. O esperado é pedido criado, total de R$ 80,00 e confirmação sem endereço de entrega.

O PR e o evento devem corresponder à mesma execução ou ser claramente identificados como ensaio. As soluções de referência são públicas; informar se o agente as consultou.

## Contingência e limite de tempo

No início do bloco de resultados, verificar se existe PR utilizável. Se o agente estiver atrasado, falhar ou não produzir evidências suficientes, mostrar o PR concluído do ensaio e explicar o estado real da execução ao vivo. Não iniciar CAT-001 como tentativa de compensar atraso.

Se revisão, checks ou deploy não concluírem a tempo, mostrar a versão corrigida e as evidências do ensaio, explicitando a origem. Preservar o tempo de perguntas; não aprovar uma correção somente para cumprir o relógio.

CAT-001 só pode substituir o cenário principal se essa alternativa tiver sido previamente preparada e ensaiada. Não é um segundo bloco obrigatório da apresentação.

## Encerramento

Registrar os links e resultados, preservar as revisões e encerrar todos os processos iniciados para a tarefa. Para outro ensaio, criar uma nova tentativa a partir do commit defeituoso, mantendo os PRs anteriores.

O scaffold saudável já existe. O defeito isolado CHK-001, a instrumentação Sentry e o workflow do agente ainda serão implementados antes do ensaio.
