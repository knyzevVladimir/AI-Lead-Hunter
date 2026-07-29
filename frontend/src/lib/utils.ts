import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Слияние классов с корректным разрешением конфликтов Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ограничение числа диапазоном. */
export const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

/** Пауза — нужна для искусственных стадий прогресса и демо-режима. */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Выполняет задачи пачками с ограниченной параллельностью.
 * Массовых операций на бэкенде нет, поэтому «изменить статус у 200 лидов»
 * превращается в 200 запросов — без ограничения это положит и браузер, и сервер.
 */
export async function runPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<{ results: (R | null)[]; errors: { index: number; error: unknown }[] }> {
  const { concurrency = 4, onProgress, signal } = options;
  const results: (R | null)[] = new Array(items.length).fill(null);
  const errors: { index: number; error: unknown }[] = [];
  let cursor = 0;
  let done = 0;

  async function pump(): Promise<void> {
    while (cursor < items.length) {
      if (signal?.aborted) return;
      const index = cursor++;
      try {
        results[index] = await worker(items[index]!, index);
      } catch (error) {
        errors.push({ index, error });
      }
      done++;
      onProgress?.(done, items.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => pump()),
  );

  return { results, errors };
}

/** Стабильная сортировка по нескольким ключам с поддержкой null. */
export function compareNullable(
  a: number | string | null,
  b: number | string | null,
  dir: "asc" | "desc" = "asc",
): number {
  if (a === b) return 0;
  // null всегда в конце, независимо от направления: «нет данных» — не значение.
  if (a === null) return 1;
  if (b === null) return -1;
  const r = a < b ? -1 : 1;
  return dir === "asc" ? r : -r;
}
