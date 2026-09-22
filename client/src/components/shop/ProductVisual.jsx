import {
  Fan,
  Package,
  Settings,
  Snowflake,
} from "lucide-react";

function getProductIcon(product) {
  const name =
    product?.name?.toLowerCase() || "";

  const category =
    product?.category?.toLowerCase() || "";

  if (
    category.includes("air conditioner")
  ) {
    return Snowflake;
  }

  if (
    name.includes("fan") ||
    name.includes("motor")
  ) {
    return Fan;
  }

  if (
    name.includes("compressor") ||
    name.includes("capacitor")
  ) {
    return Settings;
  }

  return Package;
}

export default function ProductVisual({
  product,
  iconSize = 44,
  className = "",
}) {
  const image = product?.images?.find(
    (item) => item?.url
  );

  if (image?.url) {
    return (
      <img
        src={image.url}
        alt={product.name}
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }

  const Icon = getProductIcon(product);

  return (
    <Icon
      size={iconSize}
      className={className}
    />
  );
}