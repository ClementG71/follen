// src/lib/api.ts
// Data Layer pour consommation API Wagtail v2 en mode SSG

import type { WagtailMeta, WagtailResponse } from '../types/wagtail';

// ============================================================================
// TYPES TYPESCRIPT (Basés sur la réponse API Wagtail)
// ============================================================================

/**
 * Interface de base Wagtail Page
 */
export interface WagtailPage {
    id: number;
    title: string;
    meta: WagtailMeta;
}

/**
 * StreamField Block générique
 */
export interface StreamFieldBlock {
    type: string;
    value: any;
    id: string;
}

/**
 * ArticlePage (Blog)
 */
export interface Article extends WagtailPage {
    date: string;
    author: string;
    sector: 'agriculture' | 'ecologie' | 'interieur' | 'general';
    excerpt: string;
    introduction: string;
    body: StreamFieldBlock[]; // StreamField blocks
    category_info: {
        name: string;
        slug: string;
        icon: string | null;
    } | null;
    header_image_url: string | null; // URL complète
    header_image_thumbnail: string | null;
    tags_list: string[];
}

/**
 * SectorPage (Landing)
 */
export interface SectorPage extends WagtailPage {
    color_theme: 'green' | 'blue' | 'yellow' | 'red';
    context_banner_text: string;
    news_general_list: Article[]; // Déjà formaté par le backend
    news_instance_list: Article[]; // Déjà formaté par le backend
    representatives_list: {
        name: string;
        role: string;
        photo_url: string;
        email: string;
    }[];
    actions: StreamFieldBlock[]; // StreamField
}

/**
 * FormPage
 */
export interface FormPage extends WagtailPage {
    intro: string;
    thank_you_text: string;
    form_fields_data: {
        id: string;
        label: string;
        field_type: 'singleline' | 'multiline' | 'email' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'number';
        required: boolean;
        choices?: string; // CSV string pour dropdown/radio
        help_text?: string;
        default_value?: string;
    }[];
}

/**
 * StaticPage
 */
export interface StaticPage extends WagtailPage {
    content: StreamFieldBlock[];
    header_image_url: string | null;
}

/**
 * Navigation
 */
export interface Navigation {
    topbar: Array<{
        title: string;
        url: string;
        slug: string;
    }>;
    footer: Array<{
        title: string;
        url: string;
        slug: string;
    }>;
    social: Array<{
        platform: string;
        url: string;
        icon: string;
    }>;
}

/**
 * Settings globaux
 */
export interface Settings {
    site_name: string;
    site_tagline: string | null;
    contact_email: string | null;
    contact_phone: string | null;
}

// ============================================================================
// CONFIGURATION API
// ============================================================================

const RAW_API_URL = import.meta.env.PUBLIC_WAGTAIL_API_URL 
                 || import.meta.env.PUBLIC_API_URL
                 || import.meta.env.API_BASE_URL
                 || process.env.PUBLIC_WAGTAIL_API_URL
                 || process.env.PUBLIC_API_URL
                 || process.env.API_BASE_URL
                 || 'https://maen.kwzz.eu';

const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const API_V2_URL = `${API_BASE_URL}/api/v2`;

console.log(`[API Config] Base URL: ${API_BASE_URL}`);
console.log(`[API Config] API v2 URL: ${API_V2_URL}`);

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Fetch avec gestion d'erreurs
 */
async function apiFetch<T>(
    endpoint: string, 
    params: Record<string, string> = {}
): Promise<T | null> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_V2_URL}${cleanEndpoint}`);
    
    url.searchParams.append('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });

    try {
        const res = await fetch(url.toString());
        if (!res.ok) {
            console.error(`[API] Error ${res.status}: ${res.statusText} - ${url.toString()}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`[API] Network error for ${url.toString()}:`, error);
        return null;
    }
}

/**
 * Fetch avec pagination complète (pour SSG)
 */
async function apiFetchAll<T>(
    endpoint: string,
    params: Record<string, string> = {},
    limit: number = 100
): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const pageParams = {
            ...params,
            limit: limit.toString(),
            offset: offset.toString(),
        };

        const response = await apiFetch<WagtailResponse<T>>(endpoint, pageParams);
        
        if (!response || !response.items) {
            break;
        }

        allItems.push(...response.items);

        // Vérifier s'il y a plus de pages
        const totalCount = response.meta?.total_count || 0;
        hasMore = allItems.length < totalCount;
        offset += limit;
    }

    return allItems;
}

// ============================================================================
// FONCTIONS API PUBLIQUES
// ============================================================================

/**
 * Récupère toutes les pages (avec pagination pour SSG)
 */
export async function getAllPages(limit: number = 100): Promise<WagtailPage[]> {
    return apiFetchAll<WagtailPage>('/pages/', {}, limit);
}

/**
 * Récupère toutes les pages d'un type spécifique
 */
export async function getAllPagesByType<T extends WagtailPage>(
    type: string,
    limit: number = 100
): Promise<T[]> {
    return apiFetchAll<T>('/pages/', { type }, limit);
}

/**
 * Récupère une page par slug
 */
export async function getPageBySlug<T extends WagtailPage>(
    slug: string,
    type?: string
): Promise<T | null> {
    const params: Record<string, string> = { slug };
    if (type) params.type = type;
    
    const response = await apiFetch<WagtailResponse<T>>('/pages/', params);
    return response?.items?.[0] || null;
}

/**
 * Récupère une page par ID
 */
export async function getPageById<T extends WagtailPage>(
    id: number
): Promise<T | null> {
    const response = await apiFetch<WagtailResponse<T>>('/pages/', { id: id.toString() });
    return response?.items?.[0] || null;
}

/**
 * Récupère tous les articles
 */
export async function getAllArticles(limit: number = 100): Promise<Article[]> {
    return getAllPagesByType<Article>('blog.ArticlePage', limit);
}

/**
 * Récupère un article par slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
    return getPageBySlug<Article>(slug, 'blog.ArticlePage');
}

/**
 * Récupère toutes les SectorPages
 */
export async function getAllSectorPages(limit: number = 100): Promise<SectorPage[]> {
    return getAllPagesByType<SectorPage>('blog.SectorPage', limit);
}

/**
 * Récupère une SectorPage par slug
 */
export async function getSectorPageBySlug(slug: string): Promise<SectorPage | null> {
    return getPageBySlug<SectorPage>(slug, 'blog.SectorPage');
}

/**
 * Récupère toutes les FormPages
 */
export async function getAllFormPages(limit: number = 100): Promise<FormPage[]> {
    return getAllPagesByType<FormPage>('blog.FormPage', limit);
}

/**
 * Récupère une FormPage par slug
 */
export async function getFormPageBySlug(slug: string): Promise<FormPage | null> {
    return getPageBySlug<FormPage>(slug, 'blog.FormPage');
}

/**
 * Récupère toutes les StaticPages
 */
export async function getAllStaticPages(limit: number = 100): Promise<StaticPage[]> {
    return getAllPagesByType<StaticPage>('blog.StaticPage', limit);
}

/**
 * Récupère une StaticPage par slug
 */
export async function getStaticPageBySlug(slug: string): Promise<StaticPage | null> {
    return getPageBySlug<StaticPage>(slug, 'blog.StaticPage');
}

/**
 * Récupère la navigation
 */
export async function getNavigation(): Promise<Navigation | null> {
    try {
        const url = `${API_BASE_URL}/api/navigation/`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`[API] Navigation error ${res.status}: ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`[API] Navigation network error:`, error);
        return null;
    }
}

/**
 * Récupère les settings globaux
 */
export async function getSettings(): Promise<Settings | null> {
    try {
        const url = `${API_BASE_URL}/api/settings/`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`[API] Settings error ${res.status}: ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`[API] Settings network error:`, error);
        return null;
    }
}

/**
 * Soumet un formulaire Wagtail
 * @param pageId ID de la FormPage
 * @param formData Données du formulaire (clés = clean_name des champs)
 */
export async function submitForm(
    pageId: number,
    formData: Record<string, string | string[]>
): Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }> {
    try {
        const url = `${API_V2_URL}/forms/submit/${pageId}/`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                success: false,
                message: errorData.message || `Erreur ${res.status}: ${res.statusText}`,
                errors: errorData.errors || {},
            };
        }

        const data = await res.json();
        return {
            success: true,
            message: data.message || 'Formulaire soumis avec succès',
        };
    } catch (error) {
        console.error(`[API] Form submission error:`, error);
        return {
            success: false,
            message: 'Erreur réseau lors de la soumission du formulaire',
        };
    }
}

