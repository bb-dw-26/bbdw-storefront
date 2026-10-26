export const urls = {
  catalog: import.meta.env.VITE_CATALOG_URL ?? "http://localhost:3002",
  checkout: import.meta.env.VITE_CHECKOUT_URL ?? "http://localhost:3003",
};

export type Address = {
  postalCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
};
export type AddressLookup = Omit<Address, "number" | "complement">;
export const emptyAddress: Address = { postalCode: "", street: "", number: "", neighborhood: "", city: "", state: "", complement: "" };
export function normalizeAddress(address: Address): Address {
  return {
    postalCode: address.postalCode.trim().replace(/^(\d{5})-(\d{3})$/, "$1$2"),
    street: address.street.trim(), number: address.number.trim(),
    neighborhood: address.neighborhood.trim(), city: address.city.trim(),
    state: address.state.trim().toUpperCase(), complement: address.complement.trim(),
  };
}
export function validAddress(address: Address) {
  const normalized = normalizeAddress(address);
  return /^\d{8}$/.test(normalized.postalCode) && !!normalized.street && !!normalized.number && !!normalized.city && /^[A-Z]{2}$/.test(normalized.state);
}
export type Product = {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
  thumbnailUrl: string | null;
};
export type Order = {
  id: string;
  fulfillment: "pickup" | "delivery";
  deliveryAddress: Address | null;
  totalCents: number;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10000),
    headers: { "X-Request-ID": crypto.randomUUID(), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.error?.message ?? "Não foi possível concluir a operação.",
      body?.requestId,
    );
  }
  return response.json();
}
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
