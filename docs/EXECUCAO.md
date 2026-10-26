# Execução integrada

## Layout dos checkouts

Clone os três repositórios como pastas irmãs:

```text
workspace/
  bbdw-catalog/
  bbdw-checkout/
  bbdw-storefront/
```

## Com Docker

Com Docker Engine ativo e Compose disponível, execute no storefront:

```sh
docker compose up --build -d
docker compose ps
```

Abra http://localhost:3000. A composição usa imagens locais construídas dos checkouts. As URLs Vite são incorporadas no build e precisam ser acessíveis pelo navegador, por isso usam localhost no ambiente local.

Ao terminar:

```sh
docker compose down
```

## Sem Docker

Instale Node.js 24 e a versão do Go indicada no catálogo. Execute cada comando em um terminal próprio:

| Pasta | Preparação | Iniciar |
| --- | --- | --- |
| bbdw-catalog | Go disponível no PATH | `go run ./cmd/server` |
| bbdw-checkout | `npm ci` | `npm run dev` |
| bbdw-storefront | `npm ci` | `npm run dev` |

As APIs usam as portas 3002 e 3003. A interface usa 3000. Encerre todos os terminais de servidor com Ctrl+C após a tarefa.

## Conferência manual

Abra a interface, selecione produtos e finalize um pedido. Confira a resposta da API e os contratos descritos em `SPEC.md`. Os pedidos são fictícios e não têm persistência.

## Validação por repositório

`npm run check` nos projetos Node; `go vet ./...`, `go test ./...` e `go build ./cmd/server` no catálogo. Antes do teste do storefront, instalar o navegador com `npx playwright install chromium`.

O CI do storefront testa falha 500 e sucesso posterior usando APIs simuladas. Os testes HTTP do checkout usam um servidor de dependências simulado e validam os contratos de erro.

## Smoke test com as três aplicações

Depois de `npm ci` nos dois projetos Node, execute `npm run build` no checkout. No catálogo, compile com `go build -o bin/catalog ./cmd/server` (Windows: `go build -o bin/catalog.exe ./cmd/server`). Instale o Chromium do Playwright no storefront.

Com as portas 3200, 3202 e 3203 livres, execute `npm run smoke` no storefront. O script inicia os três processos nas portas de teste, testa retirada sem consulta de CEP e entrega com ViaCEP simulado no navegador real, verifica o layout mobile e salva uma captura em `test-results/integrated.png`. Ao terminar, encerra os processos que iniciou, inclusive em caso de falha.
