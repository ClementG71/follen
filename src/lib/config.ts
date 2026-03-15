interface ApiConfig {
  baseUrl: string;
  apiPath: string;
  get apiUrl(): string;
}

const RAW_API_URL = import.meta.env.PUBLIC_WAGTAIL_API_URL 
                 || import.meta.env.PUBLIC_API_URL
                 || import.meta.env.API_BASE_URL
                 || 'https://maen.kwzz.eu';

export const API_CONFIG: ApiConfig = {
  baseUrl: RAW_API_URL.replace(/\/+$/, ''),
  apiPath: '/api/v2',
  get apiUrl(): string {
    return `${this.baseUrl}${this.apiPath}`;
  }
};

if (import.meta.env.DEV) {
  console.log(`[Config] Base URL: ${API_CONFIG.baseUrl}`);
  console.log(`[Config] API URL: ${API_CONFIG.apiUrl}`);
}