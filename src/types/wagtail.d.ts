// src/types/wagtail.d.ts

export interface WagtailMeta {
    type: string;
    detail_url: string;
    html_url: string;
    slug: string;
    first_published_at: string;
}

export interface FeatureValue {
    title: string;
    description: string;
    icon: string;
}

export interface FeatureBlock {
    type: 'feature';
    value: FeatureValue;
    id: string;
}

export interface HomePage {
    id: number;
    meta: WagtailMeta;
    title: string;
    hero_title: string;
    hero_subtitle: string;
    hero_cta_text: string;
    hero_cta_link: string;
    features: FeatureBlock[];
}

export interface BlogPage {
    id: number;
    meta: WagtailMeta;
    title: string;
    date: string;
    author: string;
    introduction: string;
    header_image_thumbnail: string | null;
    // Ajoutez d'autres champs au besoin
}

export interface WagtailResponse<T> {
    meta: {
        total_count: number;
    };
    items: T[];
}

