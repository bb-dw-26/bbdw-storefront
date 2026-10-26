import { useState } from "react";
import type { Product } from "./api";

export function Icon({
  name,
}: {
  name:
    | "bag"
    | "plus"
    | "minus"
    | "close"
    | "store"
    | "truck"
    | "card"
    | "pix"
    | "check"
    | "spark"
    | "box";
}) {
  const paths = {
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    store: (
      <>
        <path d="m3 10 2-7h14l2 7M4 11v10h16V11M9 21v-7h6v7" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      </>
    ),
    truck: (
      <>
        <path d="M3 5h11v12H3V5Zm11 4h4l3 4v4h-7M14 13h7" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="18" r="2.5" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    pix: (
      <>
        <path d="m12 2 10 10-10 10L2 12 12 2Z" />
        <path d="m7 7 5 5 5-5M7 17l5-5 5 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />,
    box: (
      <>
        <path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8M12 12v10M7.5 5.5l9 5" />
      </>
    ),
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function ProductImage({ product }: { product: Product }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const source = product.thumbnailUrl;
  return source && source !== failedUrl ? (
    <img
      src={source}
      alt={product.name}
      loading="lazy"
      decoding="async"
      width={512}
      height={512}
      onError={() => setFailedUrl(source)}
    />
  ) : (
    <span
      className="image-placeholder"
      role="img"
      aria-label={`${product.name}: sem imagem`}
    >
      <Icon name="box" />
      <span>Imagem em breve</span>
    </span>
  );
}
