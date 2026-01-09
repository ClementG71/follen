// src/lib/wagtail.ts
import type { HomePage, BlogPage, WagtailResponse } from '../types/wagtail';

// Récupération sécurisée de l'URL API
const RAW_API_URL = import.meta.env.PUBLIC_WAGTAIL_API_URL 
                 || import.meta.env.API_BASE_URL 
                 || process.env.PUBLIC_WAGTAIL_API_URL
                 || process.env.API_BASE_URL
                 || 'https://maen.kwzz.eu/api/v2';

const API_URL = RAW_API_URL.replace(/\/+$/, '');

console.log(`[Wagtail Config] API URL: ${API_URL}`);

async function fetchWagtail<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_URL}${cleanEndpoint}`);
    
    url.searchParams.append('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    try {
        const res = await fetch(url.toString());
        if (!res.ok) {
            console.error(`[Wagtail] Error ${res.status}: ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`[Wagtail] Network error:`, error);
        return null;
    }
}

export async function getHomePage(): Promise<HomePage | null> {
    // On demande explicitement les champs personnalisés
    // Note: Si le backend ne les expose pas encore, l'API renverra une erreur 400.
    // Une fois le backend mis à jour avec api_fields, cela fonctionnera.
    const fields = [
        'hero_title',
        'hero_subtitle',
        'hero_cta_text',
        'hero_cta_link',
        'features'
    ].join(',');

    // Stratégie robuste : on cherche par slug 'accueil' ou 'home' ou par type
    
    // Essai 1 : Slug accueil
    let data = await fetchWagtail<WagtailResponse<HomePage>>('/pages/', {
        slug: 'accueil',
        fields: fields
    });
    if (data?.items?.length) return data.items[0];

    // Essai 2 : Slug home
    data = await fetchWagtail<WagtailResponse<HomePage>>('/pages/', {
        slug: 'home',
        fields: fields
    });
    if (data?.items?.length) return data.items[0];

    // Essai 3 : Type
    data = await fetchWagtail<WagtailResponse<HomePage>>('/pages/', {
        type: 'blog.HomePage',
        fields: fields,
        limit: '1'
    });

    return data?.items?.[0] || null;
}

export async function getBlogPosts(limit = 3): Promise<BlogPage[]> {
    const fields = [
        'date',
        'author',
        'introduction',
        'header_image_thumbnail'
    ].join(',');

    const data = await fetchWagtail<WagtailResponse<BlogPage>>('/pages/', {
        type: 'blog.BlogPage',
        fields: fields,
        order: '-date',
        limit: limit.toString()
    });

    return data?.items || [];
}

// Fonction utilitaire pour le menu (gardée pour compatibilité)
export async function getMenuPages() {
    const data = await fetchWagtail<WagtailResponse<any>>('/pages/', {
        show_in_menus: 'true',
        fields: 'slug,title'
    });
    return data?.items || [];
}

// Fonctions pour les pages de détail (gardées pour compatibilité)
export async function getBlogPostBySlug(slug: string) {
    const data = await fetchWagtail<WagtailResponse<any>>('/pages/', {
        type: 'blog.BlogPage',
        slug,
        fields: '*'
    });
    return data?.items?.[0] || null;
}

export async function getStaticPageBySlug(slug: string) {
    const data = await fetchWagtail<WagtailResponse<any>>('/pages/', {
        type: 'blog.StaticPage',
        slug,
        fields: 'content,header_image'
    });
    return data?.items?.[0] || null;
}

// ✅ SSG: Récupérer toutes les pages statiques pour getStaticPaths
export async function getStaticPages(limit = 100) {
    const data = await fetchWagtail<WagtailResponse<any>>('/pages/', {
        type: 'blog.StaticPage',
        fields: 'content,header_image',
        limit: limit.toString()
    });
    return data?.items || [];
}

