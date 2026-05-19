/**
 * Product group IDs (GID) from WHMCS - data is fetched by group, not by product ID.
 * Each category has one group ID; products in that group come from WHMCS GetProducts(gid).
 * 
 * Hardcoded fallbacks ensure these work even if NEXT_PUBLIC env vars aren't loaded at build time.
 */
export const HOSTING_PLANS = {
  shared: {
    gid: process.env.NEXT_PUBLIC_SHARED_HOSTING_GID || '1',
  },
  wordpress: {
    gid: process.env.NEXT_PUBLIC_WORDPRESS_HOSTING_GID || '3',
  },
  vps: {
    gid: process.env.NEXT_PUBLIC_VPS_HOSTING_GID || '2',
  },
  ecommerce: {
    gid: process.env.NEXT_PUBLIC_ECOMMERCE_HOSTING_GID || '4',
  },
};

export const WHMCS_URL =
  process.env.NEXT_PUBLIC_WHMCS_URL ||
  process.env.WHMCS_URL ||
  'https://webblyhosting.com';

/** Cart link still uses product ID (pid) - use the product.id from API response */
export const getWhmcsCartUrl = (pid: string) => {
  if (!pid) return '#';
  return `${WHMCS_URL}/client/cart.php?a=add&pid=${pid}`;
};
