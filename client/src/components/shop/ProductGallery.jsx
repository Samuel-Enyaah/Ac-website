import { useState } from "react";
import ProductVisual from "./ProductVisual";
export default function ProductGallery({ product }) {
  const [selected, setSelected] = useState(0);
  const images = product.images?.filter((image) => image.url) || [];
  return (
    <div className="rounded-xl border border-[#E4E9EE] bg-[#F5F8FA] p-5">
      <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-white p-4 text-[#1687D9] sm:min-h-96">
        {images.length ? (
          <img
            src={(images[selected] || images[0]).url}
            alt={product.name}
            className="max-h-96 w-full object-contain"
            decoding="async"
          />
        ) : (
          <ProductVisual product={product} iconSize={78} />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((image, index) => (
            <button
              key={image._id || image.url}
              type="button"
              aria-label={`View ${product.name} image ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 bg-white p-1 ${selected === index ? "border-[#1687D9]" : "border-gray-200"}`}
            >
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
