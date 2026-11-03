"use client";

import { useActionState, useState, type FormEvent } from "react";

import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductActionState,
} from "@/actions/admin";
import { isValidProductImageUrl } from "@/lib/validations/product";

type ProductFormLabels = {
  createTitle: string;
  editTitle: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  selectCategory: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  shortDescription: string;
  description: string;
  publish: string;
  featured: string;
  newArrival: string;
  images: string;
  mainImageUrl: string;
  additionalImageUrl: string;
  imagePlaceholder: string;
  addAnotherImage: string;
  removeImage: string;
  setPrimary: string;
  primaryImage: string;
  moveUp: string;
  moveDown: string;
  preview: string;
  invalidImageUrl: string;
  imageLoadError: string;
  invalidProduct: string;
  missingPrimaryImage: string;
  duplicate: string;
  saveProduct: string;
  saving: string;
  saved: string;
  delete: string;
  deleteConfirm: string;
};

type ProductImageValue = {
  key: string;
  url: string;
  isPrimary: boolean;
};

type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  shortDescription: string | null;
  description: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  images: Array<{ id: string; url: string; isPrimary: boolean; sortOrder: number }>;
};

type ProductCategory = { id: string; name: string };

function ProductImageUrlInput({
  image,
  index,
  total,
  labels,
  onChange,
  onRemove,
  onSetPrimary,
  onMove,
}: {
  image: ProductImageValue;
  index: number;
  total: number;
  labels: ProductFormLabels;
  onChange: (value: string) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isValid = !image.url.trim() || isValidProductImageUrl(image.url);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:p-4">
      <div className="min-w-0 space-y-3">
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>{index === 0 ? labels.mainImageUrl : `${labels.additionalImageUrl} ${index}`}</span>
          <input
            type="text"
            name="imageUrl"
            inputMode="url"
            autoComplete="url"
            value={image.url}
            required={index === 0}
            placeholder={labels.imagePlaceholder}
            aria-invalid={!isValid}
            onChange={(event) => {
              setImageFailed(false);
              onChange(event.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-cyan-600"
          />
        </label>
        {!isValid && <p className="text-sm text-red-700">{labels.invalidImageUrl}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-slate-700">
            <input
              type="radio"
              name="primaryImageIndex"
              value={index}
              checked={image.isPrimary}
              onChange={onSetPrimary}
              className="accent-cyan-700"
            />
            {labels.setPrimary}
          </label>
          {image.isPrimary && <span className="font-medium text-cyan-800">{labels.primaryImage}</span>}
          <div className="flex items-center gap-2">
            <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="text-cyan-800 disabled:text-slate-300">
              {labels.moveUp}
            </button>
            <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="text-cyan-800 disabled:text-slate-300">
              {labels.moveDown}
            </button>
            {index > 0 && (
              <button type="button" onClick={onRemove} className="text-red-700">
                {labels.removeImage}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
        {image.url.trim() && isValid && !imageFailed ? (
          <img
            src={image.url.trim()}
            alt={labels.preview}
            className="h-24 w-full object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : imageFailed ? (
          <p className="text-center text-xs text-red-700">{labels.imageLoadError}</p>
        ) : (
          <p className="text-center text-xs text-slate-400">{labels.preview}</p>
        )}
      </div>
    </div>
  );
}

export function ProductForm({
  categories,
  labels,
  locale,
  product,
}: {
  categories: ProductCategory[];
  labels: ProductFormLabels;
  locale: string;
  product?: EditableProduct;
}) {
  const initialImages = product?.images.length
    ? [...product.images]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((image) => ({ key: image.id, url: image.url, isPrimary: image.isPrimary }))
    : [{ key: "image-0", url: "", isPrimary: true }];
  const [images, setImages] = useState<ProductImageValue[]>(initialImages);
  const [nextImageKey, setNextImageKey] = useState(initialImages.length);
  const [clientError, setClientError] = useState("");
  const action = product ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState<ProductActionState, FormData>(
    action,
    { status: "idle" },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const urls = formData.getAll("imageUrl").map((value) =>
      typeof value === "string" ? value.trim() : "",
    );
    const primaryIndex = Number(formData.get("primaryImageIndex"));

    if (!urls[0] || urls.some((url) => url && !isValidProductImageUrl(url))) {
      event.preventDefault();
      setClientError(labels.invalidImageUrl);
      return;
    }

    if (!urls[primaryIndex]) {
      event.preventDefault();
      setClientError(labels.missingPrimaryImage);
      return;
    }

    setClientError("");
  }

  function updateImage(key: string, value: string) {
    setImages((current) => current.map((image) => image.key === key ? { ...image, url: value } : image));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  const errorMessage = clientError || (
    state.status === "error" && state.error
      ? labels[state.error]
      : ""
  );

  return (
    <form action={formAction} onSubmit={handleSubmit} dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-5">
      {product && <input type="hidden" name="productId" value={product.id} />}
      <h2 className="text-lg font-semibold text-slate-950">
        {product ? labels.editTitle : labels.createTitle}
      </h2>

      <fieldset disabled={isPending} className="space-y-5 disabled:opacity-70">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.name}</span>
            <input name="name" required minLength={2} maxLength={200} defaultValue={product?.name} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.slug}</span>
            <input name="slug" required pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*" maxLength={150} defaultValue={product?.slug} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.sku}</span>
            <input name="sku" required maxLength={100} defaultValue={product?.sku} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.category}</span>
            <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal">
              <option value="" disabled>{labels.selectCategory}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.price}</span>
            <input name="price" type="number" min="0.01" step="0.01" required defaultValue={product?.price} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.discountPrice}</span>
            <input name="discountPrice" type="number" min="0.01" step="0.01" defaultValue={product?.discountPrice ?? ""} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.stockQuantity}</span>
            <input name="stockQuantity" type="number" min="0" step="1" required defaultValue={product?.stockQuantity ?? 0} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>{labels.shortDescription}</span>
            <input name="shortDescription" maxLength={500} defaultValue={product?.shortDescription ?? ""} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            <span>{labels.description}</span>
            <textarea name="description" rows={4} maxLength={5000} defaultValue={product?.description ?? ""} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isPublished" value="true" defaultChecked={product?.isPublished ?? true} className="accent-cyan-700" />
            {labels.publish}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isFeatured" value="true" defaultChecked={product?.isFeatured ?? true} className="accent-cyan-700" />
            {labels.featured}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isNewArrival" value="true" defaultChecked={product?.isNewArrival ?? true} className="accent-cyan-700" />
            {labels.newArrival}
          </label>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">{labels.images}</h3>
          <div className="space-y-3">
            {images.map((image, index) => (
              <ProductImageUrlInput
                key={image.key}
                image={image}
                index={index}
                total={images.length}
                labels={labels}
                onChange={(value) => updateImage(image.key, value)}
                onRemove={() => setImages((current) => current.filter((entry) => entry.key !== image.key))}
                onSetPrimary={() => setImages((current) => current.map((entry) => ({
                  ...entry,
                  isPrimary: entry.key === image.key,
                })))}
                onMove={(direction) => moveImage(index, direction)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setImages((current) => [...current, { key: `image-${nextImageKey}`, url: "", isPrimary: false }]);
              setNextImageKey((key) => key + 1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            + {labels.addAnotherImage}
          </button>
        </section>
      </fieldset>

      {errorMessage && <p role="alert" className="text-sm font-medium text-red-700">{errorMessage}</p>}
      {state.status === "success" && <p role="status" className="text-sm font-medium text-emerald-700">{labels.saved}</p>}

      <button
        type="submit"
        disabled={isPending || categories.length === 0}
        className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? labels.saving : labels.saveProduct}
      </button>
    </form>
  );
}

export function ProductDeleteButton({
  productId,
  labels,
}: {
  productId: string;
  labels: Pick<ProductFormLabels, "delete" | "deleteConfirm">;
}) {
  return (
    <form
      action={async () => {
        await deleteProduct(productId);
      }}
      onSubmit={(event) => {
        if (!window.confirm(labels.deleteConfirm)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
        {labels.delete}
      </button>
    </form>
  );
}
