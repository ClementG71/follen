// Configuration de l'API Wagtail v2
const API_URL = import.meta.env.PUBLIC_WAGTAIL_API_URL || 'https://maen.tondomaine.com/api/v2';

/**
 * Fonction générique pour fetcher l'API Wagtail
 * @param {string} endpoint 
 * @param {Object} params 
 */
async function fetchWagtail(endpoint, params = {}) {
  // Construction de l'URL
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Ajouter les paramètres par défaut pour le format JSON
  url.searchParams.append('format', 'json');
  
  // Ajouter les paramètres spécifiques
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  try {
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      console.error(`Wagtail API Error (${res.status}): ${res.statusText}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}

/**
 * Récupérer la page d'accueil
 */
export async function getHomePage() {
  const data = await fetchWagtail('/pages/', {
    type: 'blog.HomePage',
    fields: 'hero_title,hero_subtitle,hero_cta_text,hero_cta_link,features',
    limit: '1'
  });
  
  return data?.items?.[0] || null;
}

/**
 * Récupérer les articles de blog
 * @param {number} limit 
 * @param {number} offset 
 */
export async function getBlogPosts(limit = 10, offset = 0) {
  const data = await fetchWagtail('/pages/', {
    type: 'blog.BlogPage',
    fields: 'date,author,introduction,categories,header_image,header_image_thumbnail',
    order: '-date', // Plus récents en premier
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  return data?.items || [];
}

/**
 * Récupérer un article par son slug
 * @param {string} slug 
 */
export async function getBlogPostBySlug(slug) {
  const data = await fetchWagtail('/pages/', {
    type: 'blog.BlogPage',
    slug: slug,
    fields: 'date,author,introduction,body,categories,header_image,header_image_large'
  });
  
  return data?.items?.[0] || null;
}

/**
 * Récupérer une page statique par slug
 * @param {string} slug 
 */
export async function getStaticPageBySlug(slug) {
  const data = await fetchWagtail('/pages/', {
    type: 'blog.StaticPage',
    slug: slug,
    fields: 'content,header_image'
  });
  
  return data?.items?.[0] || null;
}

/**
 * Récupérer les pages pour le menu
 */
export async function getMenuPages() {
  const data = await fetchWagtail('/pages/', {
    show_in_menus: 'true',
    fields: 'slug,title'
  });
  
  return data?.items || [];
}

