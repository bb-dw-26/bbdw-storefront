import { useEffect, useRef, type RefObject } from "react";
import {
  money,
  type ApiError,
  type Address,
  validAddress,
  type Order,
  type Product,
} from "./api";
import { Icon, ProductImage } from "./visuals";

type Props = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  items: Product[];
  cart: Record<string, number>;
  count: number;
  total: number;
  address: Address;
  addressLoading: boolean;
  addressError: string;
  onAddress: (address: Address) => void;
  onLookupAddress: () => void;
  fulfillment: "pickup" | "delivery";
  payment: "pix" | "card";
  pending: boolean;
  error: ApiError | null;
  order: Order | null;
  onQuantity: (id: string, quantity: number) => void;
  onFulfillment: (value: "pickup" | "delivery") => void;
  onPayment: (value: "pix" | "card") => void;
  onCheckout: () => void;
  onContinue: () => void;
};

export default function CheckoutPanel(props: Props) {
  const {
    open,
    onDismiss,
    returnFocusRef,
    items,
    cart,
    count,
    total,
    address,
    addressLoading,
    addressError,
    onAddress,
    onLookupAddress,
    fulfillment,
    payment,
    pending,
    error,
    order,
    onQuantity,
    onFulfillment,
    onPayment,
    onCheckout,
    onContinue,
  } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    const fallbackTrigger = returnFocusRef.current;
    pointerStartedOutside.current = false;
    const trigger =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : fallbackTrigger;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      (trigger?.isConnected ? trigger : fallbackTrigger)?.focus();
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (open && (error || order)) resultRef.current?.focus();
  }, [open, error, order]);

  function isOutside(
    event:
      | React.PointerEvent<HTMLDialogElement>
      | React.MouseEvent<HTMLDialogElement>,
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }

  return (
    <dialog
      id="checkout-panel"
      className="checkout-panel"
      ref={dialogRef}
      aria-labelledby="checkout-title"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onDismiss();
      }}
      onPointerDown={(event) => {
        pointerStartedOutside.current = isOutside(event);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Keep keyboard navigation inside the panel, including when the browser
        // would otherwise move focus to its own chrome at a dialog boundary.
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 && element.getClientRects().length > 0,
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        const dismiss =
          event.target === event.currentTarget &&
          pointerStartedOutside.current &&
          isOutside(event);
        pointerStartedOutside.current = false;
        if (dismiss) onDismiss();
      }}
    >
      <div className="panel-frame">
        <header className="panel-header">
          <div>
            <p className="eyebrow">
              SEU CARRINHO · {count} {count === 1 ? "ITEM" : "ITENS"}
            </p>
            <h2 id="checkout-title">
              {order ? "Tudo certo por aqui." : "Finalize seu pedido"}
            </h2>
          </div>
          <button
            className="icon-button"
            ref={closeRef}
            onClick={onDismiss}
            aria-label="Fechar checkout"
          >
            <Icon name="close" />
          </button>
        </header>

        {order ? (
          <>
            <div
              className="panel-body confirmation"
              ref={resultRef}
              tabIndex={-1}
              role="status"
            >
              <div className="success-symbol">
                <Icon name="check" />
              </div>
              <p className="eyebrow">OBRIGADO POR EXPERIMENTAR</p>
              <h3>Pedido confirmado!</h3>
              <p className="confirmation-copy">
                Seus favoritos já têm destino certo.
              </p>
              <div className="receipt">
                <div>
                  <span>Pedido</span>
                  <strong>{order.id}</strong>
                </div>
                <div>
                  <span>Total do pedido</span>
                  <strong>{money(order.totalCents)}</strong>
                </div>
                <div>
                  <span>Recebimento</span>
                  <strong>
                    {order.fulfillment === "pickup"
                      ? "Retirada na loja"
                      : "Entrega em casa"}
                  </strong>
                </div>
                <div>
                  <span>Pagamento demonstrativo</span>
                  <strong>
                    {payment === "pix"
                      ? "Pix de demonstração"
                      : "Cartão de teste"}
                  </strong>
                </div>
                {order.fulfillment === "delivery" && order.deliveryAddress && (
                  <div className="receipt-address">
                    <span>Endereço de entrega</span>
                    <strong>
                      {order.deliveryAddress.street}, {order.deliveryAddress.number}
                      <br />
                      {order.deliveryAddress.complement && <>{order.deliveryAddress.complement}<br /></>}
                      {order.deliveryAddress.neighborhood && <>{order.deliveryAddress.neighborhood}<br /></>}
                      {order.deliveryAddress.city}/{order.deliveryAddress.state} ·{" "}
                      {order.deliveryAddress.postalCode}
                    </strong>
                  </div>
                )}
              </div>
              <p className="simulation-note">
                Esta compra é fictícia. Nenhum pagamento foi processado.
              </p>
            </div>
            <div className="panel-footer">
              <button className="primary" onClick={onContinue}>
                Continuar comprando <span aria-hidden="true">→</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="panel-body">
              {items.length === 0 ? (
                <div className="empty-cart">
                  <span className="empty-symbol">
                    <Icon name="bag" />
                  </span>
                  <h3>Seu carrinho está esperando.</h3>
                  <p>Escolha algo para dar um toque de amarelo ao seu dia.</p>
                  <button className="secondary" onClick={onDismiss}>
                    Explorar produtos <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : (
                <>
                  <section
                    className="checkout-section"
                    aria-labelledby="items-title"
                  >
                    <div className="checkout-section-title">
                      <span>01</span>
                      <h3 id="items-title">Seus favoritos</h3>
                    </div>
                    <fieldset disabled={pending} aria-label="Itens do carrinho">
                      <div className="cart-items">
                        {items.map((product) => (
                          <article
                            className="cart-item"
                            key={product.id}
                            aria-label={product.name}
                          >
                            <div className="cart-art">
                              <ProductImage product={product} />
                            </div>
                            <div className="cart-item-info">
                              <strong>{product.name}</strong>
                              <small>
                                {money(product.priceCents)} por unidade
                              </small>
                              <div className="quantity-actions">
                                <div className="quantity-control">
                                  <button
                                    className="quantity-button"
                                    onClick={() =>
                                      onQuantity(
                                        product.id,
                                        cart[product.id] - 1,
                                      )
                                    }
                                    disabled={cart[product.id] <= 1}
                                    aria-label={`Diminuir quantidade de ${product.name}`}
                                  >
                                    <Icon name="minus" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    step="1"
                                    value={cart[product.id]}
                                    aria-label={`Quantidade de ${product.name}`}
                                    onChange={(event) => {
                                      const value = event.target.valueAsNumber;
                                      if (value >= 1)
                                        onQuantity(product.id, value);
                                    }}
                                  />
                                  <button
                                    className="quantity-button"
                                    onClick={() =>
                                      onQuantity(
                                        product.id,
                                        cart[product.id] + 1,
                                      )
                                    }
                                    disabled={cart[product.id] >= 99}
                                    aria-label={`Aumentar quantidade de ${product.name}`}
                                  >
                                    <Icon name="plus" />
                                  </button>
                                </div>
                                <button
                                  className="remove-button"
                                  onClick={() => onQuantity(product.id, 0)}
                                  aria-label={`Remover ${product.name}`}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                            <strong className="item-subtotal">
                              {money(product.priceCents * cart[product.id])}
                            </strong>
                          </article>
                        ))}
                      </div>
                    </fieldset>
                  </section>

                  <fieldset className="checkout-section" disabled={pending}>
                    <legend className="checkout-section-title">
                      <span>02</span>Como deseja receber?
                    </legend>
                    <div className="choice-grid">
                      <label className="choice">
                        <input
                          type="radio"
                          name="fulfillment"
                          value="pickup"
                          checked={fulfillment === "pickup"}
                          onChange={() => onFulfillment("pickup")}
                        />
                        <Icon name="store" />
                        <strong>Retirar na loja</strong>
                        <span>Você vem buscar</span>
                      </label>
                      <label className="choice">
                        <input
                          type="radio"
                          name="fulfillment"
                          value="delivery"
                          checked={fulfillment === "delivery"}
                          onChange={() => onFulfillment("delivery")}
                        />
                        <Icon name="truck" />
                        <strong>Receber em casa</strong>
                        <span>Informe o endereço de entrega</span>
                      </label>
                    </div>
                    {fulfillment === "delivery" && (
                      <div className="address-form">
                        <label className="field-label" htmlFor="postal-code">CEP</label>
                        <div className="postal-code-search">
                          <input id="postal-code" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={address.postalCode} onChange={(event) => onAddress({ ...address, postalCode: event.target.value })} />
                          <button className="secondary" type="button" disabled={addressLoading} onClick={onLookupAddress}>
                            {addressLoading ? "Buscando…" : "Buscar endereço"}
                          </button>
                        </div>
                        {addressLoading && <p role="status">Consultando CEP…</p>}
                        {addressError && <p role="alert">{addressError}</p>}
                        {([
                          ["street", "Rua", "address-line1"],
                          ["number", "Número", "off"],
                          ["neighborhood", "Bairro (opcional)", "address-level3"],
                          ["city", "Cidade", "address-level2"],
                          ["state", "UF", "address-level1"],
                          ["complement", "Complemento (opcional)", "address-line2"],
                        ] as const).map(([field, label, autocomplete]) => (
                          <label className="address-field" key={field}>
                            <span className="field-label">{label}</span>
                            <input autoComplete={autocomplete} maxLength={field === "state" ? 2 : 200} value={address[field]} onChange={(event) => onAddress({ ...address, [field]: event.target.value })} />
                          </label>
                        ))}
                      </div>
                    )}
                  </fieldset>

                  <fieldset className="checkout-section" disabled={pending}>
                    <legend className="checkout-section-title">
                      <span>03</span>Pagamento demonstrativo
                    </legend>
                    <div className="choice-grid">
                      <label className="choice">
                        <input
                          type="radio"
                          name="payment"
                          value="pix"
                          checked={payment === "pix"}
                          onChange={() => onPayment("pix")}
                        />
                        <Icon name="pix" />
                        <strong>Pix de demonstração</strong>
                        <span>Apenas uma simulação</span>
                      </label>
                      <label className="choice">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={payment === "card"}
                          onChange={() => onPayment("card")}
                        />
                        <Icon name="card" />
                        <strong>Cartão de teste</strong>
                        <span>Dados fictícios</span>
                      </label>
                    </div>
                    <div className="payment-info">
                      {payment === "pix" ? (
                        <p>
                          Você escolheu Pix. Nesta demonstração, não há QR Code,
                          transferência ou cobrança.
                        </p>
                      ) : (
                        <>
                          <div className="test-card">
                            <Icon name="card" />
                            <span>
                              DEMO <strong>•••• 0000</strong>
                            </span>
                            <span>CLIENTE TESTE</span>
                          </div>
                          <p>
                            Cartão ilustrativo. Nenhum dado bancário é
                            solicitado ou processado.
                          </p>
                        </>
                      )}
                    </div>
                  </fieldset>
                </>
              )}
              {error && (
                <div
                  className="alert"
                  role="alert"
                  ref={resultRef}
                  tabIndex={-1}
                >
                  <strong>Não foi possível finalizar.</strong>
                  <p>{error.message}</p>
                  {error.requestId && (
                    <small>Referência: {error.requestId}</small>
                  )}
                  <p>Seu carrinho foi mantido. Você pode tentar novamente.</p>
                </div>
              )}
            </div>
            <div className="panel-footer">
              <div className="order-total">
                <div>
                  <span>Total estimado</span>
                  <small>
                    {count}{" "}
                    {count === 1 ? "item selecionado" : "itens selecionados"}
                  </small>
                </div>
                <strong>{money(total)}</strong>
              </div>
              <button
                className="primary"
                disabled={pending || items.length === 0 || addressLoading || (fulfillment === "delivery" && !validAddress(address))}
                onClick={onCheckout}
              >
                {pending ? (
                  <>
                    <span className="spinner" /> Finalizando…
                  </>
                ) : (
                  <>
                    Finalizar compra <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
              <p className="simulation-note">
                Simulação: nenhuma cobrança será realizada.
              </p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
