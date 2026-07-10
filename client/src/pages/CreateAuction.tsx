import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import Navbar from '../components/layout/Navbar';
import * as auctionService from '../services/auctionService';
import * as categoryService from '../services/categoryService';
import type { AuctionImage, Category } from '../types/auction';
import { resolveImageUrl } from '../utils/media';
import { Banner, Field, btnCls, inputCls } from './Login';

const schema = z
  .object({
    categoryId: z.coerce.number().int().positive('Choose a category'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    startingPrice: z.coerce.number().positive('Starting price must be greater than 0'),
    reservePrice: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
    minBidIncrement: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

type FormValues = z.input<typeof schema>;

const MAX_IMAGES = 5;

export default function CreateAuction() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [auctionId, setAuctionId] = useState<number | null>(null);
  const [images, setImages] = useState<AuctionImage[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    void categoryService.listCategories().then(setCategories).catch(() => undefined);
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const created = await auctionService.createAuction({
        categoryId: Number(values.categoryId),
        title: values.title,
        description: values.description,
        startingPrice: Number(values.startingPrice),
        reservePrice: values.reservePrice ? Number(values.reservePrice) : null,
        minBidIncrement: values.minBidIncrement ? Number(values.minBidIncrement) : undefined,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      });
      setAuctionId(created.id);
    } catch (err) {
      setServerError(errMsg(err, 'Failed to create auction'));
    }
  });

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || !auctionId) return;
    const files = Array.from(fileList);
    if (images.length + files.length > MAX_IMAGES) {
      setServerError(`You can upload at most ${MAX_IMAGES} images`);
      return;
    }
    setUploading(true);
    setServerError(null);
    try {
      const created = await auctionService.uploadImages(auctionId, files);
      setImages((prev) => [...prev, ...created]);
    } catch (err) {
      setServerError(errMsg(err, 'Image upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: number) => {
    if (!auctionId) return;
    try {
      await auctionService.deleteImage(auctionId, imageId);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err) {
      setServerError(errMsg(err, 'Failed to remove image'));
    }
  };

  const publish = async () => {
    if (!auctionId) return;
    setPublishing(true);
    setServerError(null);
    try {
      await auctionService.publishAuction(auctionId);
      navigate('/dashboard');
    } catch (err) {
      setServerError(errMsg(err, 'Failed to publish'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efedea] text-black">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Create an auction</h1>
        {serverError && <div className="mt-4"><Banner tone="error">{serverError}</Banner></div>}

        {auctionId === null ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field label="Category" error={errors.categoryId?.message}>
              <select className={inputCls} defaultValue="" {...register('categoryId')}>
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title" error={errors.title?.message}>
              <input className={inputCls} {...register('title')} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <textarea className={inputCls} rows={5} {...register('description')} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Starting price" error={errors.startingPrice?.message}>
                <input className={inputCls} type="number" step="0.01" min="0" {...register('startingPrice')} />
              </Field>
              <Field label="Reserve (optional)" error={errors.reservePrice?.message}>
                <input className={inputCls} type="number" step="0.01" min="0" {...register('reservePrice')} />
              </Field>
              <Field label="Min increment" error={errors.minBidIncrement?.message}>
                <input className={inputCls} type="number" step="0.01" min="0" {...register('minBidIncrement')} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start time" error={errors.startTime?.message}>
                <input className={inputCls} type="datetime-local" {...register('startTime')} />
              </Field>
              <Field label="End time" error={errors.endTime?.message}>
                <input className={inputCls} type="datetime-local" {...register('endTime')} />
              </Field>
            </div>
            <button type="submit" disabled={isSubmitting} className={btnCls}>
              {isSubmitting ? 'Creating…' : 'Create draft'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <Banner tone="success">
              Draft created. Add up to {MAX_IMAGES} images, then publish.
            </Banner>

            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <img
                      src={resolveImageUrl(img.thumbnailUrl) ?? ''}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => void removeImage(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-500 dark:border-slate-700">
                    {uploading ? 'Uploading…' : '+ Add images'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => void onFiles(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void publish()}
                disabled={publishing || images.length === 0}
                className={btnCls}
              >
                {publishing ? 'Publishing…' : 'Publish auction'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="shrink-0 rounded-full border border-black/25 px-5 py-2.5 font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                Save as draft
              </button>
            </div>
            {images.length === 0 && (
              <p className="text-xs text-slate-500">Add at least one image to publish.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof AxiosError ? (err.response?.data?.error ?? fallback) : fallback;
}
