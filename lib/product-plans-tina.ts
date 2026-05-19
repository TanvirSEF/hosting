import { promises as fs } from 'fs';
import path from 'path';
export type ProductGroupKey = 'shared' | 'wordpress' | 'vps' | 'ecommerce';

type TinaPlan = {
  whmcsProductId: number;
  name: string;
  tagline?: string;
  description?: string;
  features: string[];
};

type TinaFile = {
  plans: TinaPlan[];
};

function getTinaFilePath(groupKey: ProductGroupKey, locale: string) {
  return path.join(
    process.cwd(),
    'translations',
    'product-plans',
    groupKey,
    `${locale}.json`
  );
}

export async function readTinaPlans(
  groupKey: ProductGroupKey,
  locale: string
): Promise<TinaPlan[]> {
  const filePath = getTinaFilePath(groupKey, locale);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as TinaFile;
    return Array.isArray(parsed.plans) ? parsed.plans : [];
  } catch {
    return [];
  }
}

export async function writeTinaPlans(
  groupKey: ProductGroupKey,
  locale: string,
  plans: TinaPlan[]
) {
  const filePath = getTinaFilePath(groupKey, locale);
  const content: TinaFile = { plans };
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
}

/** Map Tina translations by product ID for a locale. */
export async function getTinaTranslationMap(
  groupKey: ProductGroupKey,
  locale: string
) {
  const plans = await readTinaPlans(groupKey, locale);
  const map = new Map<number, TinaPlan>();
  for (const plan of plans) {
    map.set(plan.whmcsProductId, plan);
  }
  return map;
}
