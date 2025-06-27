/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'astro:content' {
  export const z: typeof import('zod').z;
  export function defineCollection(config: {
    type?: 'content' | 'data';
    schema?: import('zod').ZodSchema;
  }): unknown;
  export function getCollection(collection: string): Promise<Array<{
    slug: string;
    body: string;
    collection: string;
    data: Record<string, unknown>;
  }>>;
  export function getEntry(collection: string, slug: string): Promise<{
    slug: string;
    body: string;
    collection: string;
    data: Record<string, unknown>;
  }>;
}