import { siteConfig } from '../config/site';

/**
 * Fetches active RCS products from the public API
 */
export const getPublicProducts = async () => {
  try {
    const response = await fetch(`${siteConfig.apiUrl}/public/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('API Error (Products):', error);
    return [];
  }
};
