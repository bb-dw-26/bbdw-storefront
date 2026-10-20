# Execução integrada do scaffold

## Estado desta etapa

As quatro aplicações executam a compra saudável. Não há defeito intencional, conexão Sentry, workflow de agente ou deploy remoto nesta etapa. O próximo passo é preservar esta base e preparar CHK-001 em uma revisão isolada.

## Layout dos checkouts

Clone os quatro repositórios como pastas irmãs:

```text
workspace/
  bbw-users/
  bbw-catalog/
  bbw-checkout/
  bbw-storefront/
```

## Com Docker

Com Docker Engine ativo e Compose disponível, execute no storefront:

```sh
docker compose up --build -d
docker compose ps
```

Abra http://localhost:3000. A composição usa imagens locais construídas dos checkouts; fixe commits/imagens ao preparar o ensaio do evento. As URLs Vite são incorporadas no build e precisam ser acessíveis pelo navegador, por isso usam localhost no ambiente local.

Ao terminar:

```sh
docker compose down
```

## Sem Docker

Instale Node.js 24 e a versão do Go indicada no catálogo. Execute cada comando em um terminal próprio:

| Pasta | Preparação | Iniciar |
| --- | --- | --- |
| bbw-users | `npm ci` | `npm run dev` |
| bbw-catalog | Go disponível no PATH | `go run ./cmd/server` |
| bbw-checkout | `npm ci` | `npm run dev` |
| bbw-storefront | `npm ci` | `npm run dev` |

As APIs usam as portas 3001, 3002 e 3003. A interface usa 3000. Encerre todos os terminais de servidor com Ctrl+C após a tarefa.

## Conferência manual

1. Abra a interface e aguarde o catálogo e os clientes.
2. Mantenha Cliente Retirada, duas Canecas Demo e Retirar na loja.
3. Finalize: a confirmação deve mostrar R$ 80,00 e retirada, sem endereço.
4. Com o mesmo cliente, selecione Receber em casa: deve aparecer a validação de endereço; o carrinho permanece.
5. Selecione Cliente Entrega: entrega deve concluir normalmente.

O pedido é fictício e não tem persistência. Cada nova submissão manual cria uma nova confirmação.

## Validação por repositório

`npm run check` nos projetos Node; `go vet ./...`, `go test ./...` e `go build ./cmd/server` no catálogo. Antes do teste do storefront, instalar o navegador com `npx playwright install chromium`.

O CI do storefront testa falha 500 e sucesso posterior usando APIs simuladas. Os testes HTTP do checkout usam um servidor de dependências simulado e validam os contratos de erro.

## Smoke test com as quatro aplicações

Depois de `npm ci` nos três projetos Node, execute `npm run build` em users e checkout. No catálogo, compile com `go build -o bin/catalog ./cmd/server` (Windows: `go build -o bin/catalog.exe ./cmd/server`). Instale o Chromium do Playwright no storefront.

Com as portas 3000–3003 livres, execute `npm run smoke` no storefront. O script inicia os quatro processos, testa retirada e entrega no navegador real, verifica o layout mobile e salva uma captura em `test-results/integrated.png`. Ao terminar, encerra os processos que iniciou, inclusive em caso de falha.
