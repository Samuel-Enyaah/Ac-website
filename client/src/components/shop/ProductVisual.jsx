import { Fan, Package, Settings, Snowflake } from "lucide-react";

function getProductIcon(product) {
  const name = product?.name?.toLowerCase() || "";

  const category = product?.category?.toLowerCase() || "";

  if (category.includes("air conditioner")) {
    return "snowflake";
  }

  if (name.includes("fan") || name.includes("motor")) {
    return "fan";
  }

  if (name.includes("compressor") || name.includes("capacitor")) {
    return "settings";
  }

  return "package";
}

export default function ProductVisual({
  product,
  iconSize = 44,
  className = "",
}) {
  const image = product?.images?.find((item) => item?.url);

  if (image?.url) {
    return (
      <img
        src={image.url}
        loading="lazy"
        decoding="async"
        alt={product.name}
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }

  const kind = getProductIcon(product);
  const props = { size: iconSize, className };
  if (kind === "snowflake") return <Snowflake {...props} />;
  if (kind === "fan") return <Fan {...props} />;
  if (kind === "settings") return <Settings {...props} />;

  return <Package size={iconSize} className={className} />;
}
