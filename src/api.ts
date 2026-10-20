export const urls = {
  users: import.meta.env.VITE_USERS_URL ?? "http://localhost:3001",
  catalog: import.meta.env.VITE_CATALOG_URL ?? "http://localhost:3002",
  checkout: import.meta.env.VITE_CHECKOUT_URL ?? "http://localhost:3003",
};

export type Customer = {
  id: string;
  name: string;
  address: { postalCode: string; street: string; city: string } | null;
};
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
  deliveryAddress: Customer["address"];
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
