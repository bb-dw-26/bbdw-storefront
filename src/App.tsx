import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  money,
  request,
  urls,
  type Customer,
  type Order,
  type Product,
} from "./api";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [customerId, setCustomerId] = useState("customer-pickup");
  const [cart, setCart] = useState<Record<string, number>>({
    "product-standard": 2,
  });
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(10000),
    ]);
    Promise.all([
      request<{ items: Product[] }>(`${urls.catalog}/products`, { signal }),
      Promise.all(
        ["customer-pickup", "customer-delivery"].map((id) =>
          request<Customer>(`${urls.users}/users/${id}`, { signal }),
        ),
      ),
    ])
      .then(([catalog, profiles]) => {
        setProducts(catalog.items);
        setCustomers(profiles);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setLoadError(
            "Não foi possível carregar a loja. Confira os serviços e recarregue a página.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const items = products.filter((product) => (cart[product.id] ?? 0) > 0);
  const total = items.reduce(
    (sum, product) => sum + product.priceCents * cart[product.id],
    0,
  );

  function changeQuantity(id: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return;
    setCart((previous) => ({ ...previous, [id]: quantity }));
    setOrder(null);
    setError(null);
  }

  async function checkout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setOrder(null);
    try {
      const result = await request<Order>(`${urls.checkout}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          fulfillment,
          items: items.map((product) => ({
            productId: product.id,
            quantity: cart[product.id],
          })),
        }),
      });
      setOrder(result);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure
          : new ApiError(
              "Não foi possível conectar ao checkout. Tente novamente.",
            ),
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="shell">
      <header>
        <a className="brand" href="/">
          loja<span>demo</span>
          <span className="dot">.</span>
        </a>
        <span className="badge">BBDW · ambiente de demonstração</span>
      </header>
      <main>
        <section className="intro">
          <p className="eyebrow">ESCOLHA. FINALIZE. EXPERIMENTE.</p>
          <h1>
            Uma compra simples.
            <br />
            <span>Uma história para contar.</span>
          </h1>
          <p>
            Produtos e clientes fictícios para acompanhar a experiência de ponta
            a ponta.
          </p>
        </section>
        {loading && <p role="status">Carregando a loja…</p>}
        {loadError && (
          <p className="alert" role="alert">
            {loadError}
          </p>
        )}
        {!loading && !loadError && (
          <div className="layout">
            <section aria-labelledby="products-title">
              <div className="section-title">
                <h2 id="products-title">Nossa seleção</h2>
                <span>{products.length} produtos</span>
              </div>
              <div className="products">
                {products.map((product) => (
                  <article className="product" key={product.id}>
                    <div className="product-art">
                      {product.thumbnailUrl ? (
                        <img src={product.thumbnailUrl} alt={product.name} />
                      ) : (
                        <span
                          role="img"
                          aria-label={`${product.name}: sem imagem`}
                        >
                          ◇
                        </span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>{money(product.priceCents)}</p>
                      <button
                        className="secondary"
                        disabled={
                          pending ||
                          !product.available ||
                          (cart[product.id] ?? 0) >= 99
                        }
                        onClick={() =>
                          changeQuantity(
                            product.id,
                            (cart[product.id] ?? 0) + 1,
                          )
                        }
                      >
                        {product.available
                          ? "Adicionar ao carrinho"
                          : "Indisponível"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <aside aria-labelledby="cart-title">
              <p className="eyebrow">SEU PEDIDO</p>
              <h2 id="cart-title">Quase lá.</h2>
              <fieldset disabled={pending}>
                <label htmlFor="customer">Cliente</label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value);
                    setOrder(null);
                    setError(null);
                  }}
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="fulfillment">Como deseja receber?</label>
                <select
                  id="fulfillment"
                  value={fulfillment}
                  onChange={(event) => {
                    setFulfillment(event.target.value as "pickup" | "delivery");
                    setOrder(null);
                    setError(null);
                  }}
                >
                  <option value="pickup">Retirar na loja</option>
                  <option value="delivery">Receber em casa</option>
                </select>
                <div className="cart-items">
                  {items.map((product) => (
                    <div className="cart-item" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <small>{money(product.priceCents)} por unidade</small>
                      </div>
                      <label className="quantity">
                        <span className="sr-only">
                          Quantidade de {product.name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          value={cart[product.id]}
                          onChange={(event) =>
                            changeQuantity(
                              product.id,
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="total">
                <span>Total estimado</span>
                <strong>{money(total)}</strong>
              </div>
              <button
                className="primary"
                disabled={pending || items.length === 0}
                onClick={checkout}
              >
                {pending ? "Finalizando…" : "Finalizar compra"}
                <span aria-hidden="true"> →</span>
              </button>
              <p className="hint">Nenhuma cobrança será realizada.</p>
              {error && (
                <div className="alert" role="alert">
                  <strong>Não foi dessa vez.</strong>
                  <p>{error.message}</p>
                  {error.requestId && (
                    <small>Referência: {error.requestId}</small>
                  )}
                  <p>Seu carrinho foi mantido. Você pode tentar novamente.</p>
                </div>
              )}
              {order && (
                <div className="success" role="status">
                  <strong>Pedido confirmado!</strong>
                  <p>
                    {money(order.totalCents)} ·{" "}
                    {order.fulfillment === "pickup"
                      ? "Retirada na loja"
                      : "Entrega em casa"}
                  </p>
                  {order.fulfillment === "delivery" &&
                    order.deliveryAddress && (
                      <p>
                        {order.deliveryAddress.street} ·{" "}
                        {order.deliveryAddress.city}
                      </p>
                    )}
                  <small>Pedido {order.id}</small>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
      <footer>
        Loja Demo · BBDW<span>Uma experiência fictícia, do início ao fim.</span>
      </footer>
    </div>
  );
}
