"use client";

import { useState } from "react";

type ProductImage = {
  url: string;
  altText: string | null;
  isPrimary: boolean;
};

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [selectedImage, setSelectedImage] = useState(
    () => images.find((image) => image.isPrimary) ?? images[0],
  );

  return (
    <div className="space-y-4">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-4 sm:p-8">
        {selectedImage ? (
          <img
            src={selectedImage.url}
            alt={selectedImage.altText ?? productName}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-4xl font-semibold text-slate-500">
            {productName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isSelected = selectedImage?.url === image.url;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                aria-label={image.altText ?? `${productName} ${index + 1}`}
                aria-pressed={isSelected}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white p-1 transition sm:h-20 sm:w-20 ${
                  isSelected ? "border-orange-500 ring-1 ring-orange-500" : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.altText ?? `${productName} ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
