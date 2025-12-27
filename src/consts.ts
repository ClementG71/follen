export const SITE_TITLE = 'Follen';
export const SITE_DESCRIPTION = 'Votre guide vers un mode de vie durable';

export const RAW_API_URL = import.meta.env.PUBLIC_WAGTAIL_API_URL 
                 || import.meta.env.API_BASE_URL 
                 || process.env.PUBLIC_WAGTAIL_API_URL
                 || process.env.API_BASE_URL
                 || 'https://maen.kwzz.eu/api/v2';

export const API_URL = RAW_API_URL.replace(/\/+$/, '');

