import { promises as fs } from 'fs';
import path from 'path';
export type ProductGroupKey = 'shared' | 'wordpress' | 'vps' | 'ecommerce';

type ProductPlanTranslation = {
  whmcsProductId: number;
  name: string;
  tagline?: string;
  description?: string;
  features: string[];
};

type ProductPlanFile = {
  plans: ProductPlanTranslation[];
};

function getFilePath(groupKey: ProductGroupKey, locale: string) {
  return path.join(
    process.cwd(),
    'translations',
    'product-plans',
    groupKey,
    `${locale}.json`
  );
}

export async function readPlans(
  groupKey: ProductGroupKey,
  locale: string
): Promise<ProductPlanTranslation[]> {
  const filePath = getFilePath(groupKey, locale);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as ProductPlanFile;
    return Array.isArray(parsed.plans) ? parsed.plans : [];
  } catch {
    return [];
  }
}

export async function writePlans(
  groupKey: ProductGroupKey,
  locale: string,
  plans: ProductPlanTranslation[]
) {
  const filePath = getFilePath(groupKey, locale);
  const content: ProductPlanFile = { plans };
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
}

/** Map translations by product ID for a locale. */
export async function getTranslationMap(
  groupKey: ProductGroupKey,
  locale: string
) {
  const plans = await readPlans(groupKey, locale);
  const map = new Map<number, ProductPlanTranslation>();
  for (const plan of plans) {
    map.set(plan.whmcsProductId, plan);
  }
  return map;
}
