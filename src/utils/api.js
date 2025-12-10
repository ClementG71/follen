// Configuration de l'API pour communiquer avec Wagtail
const API_BASE_URL = import.meta.env.API_BASE_URL 
    ? import.meta.env.API_BASE_URL 
    : import.meta.env.PROD 
        ? 'https://votre-domaine-wagtail.railway.app' 
        : 'http://localhost:8000';

// Fonction pour récupérer la page d'accueil
export async function getHomepage() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/homepage/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching homepage:', error);
        return null;
    }
}

// Fonction pour récupérer tous les articles de blog
export async function getBlogPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/blog/posts/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

// Fonction pour récupérer un article de blog spécifique
export async function getBlogPost(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/blog/posts/${slug}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching blog post ${slug}:`, error);
        return null;
    }
}

// Fonction pour récupérer toutes les pages statiques
export async function getStaticPages() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/static/pages/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching static pages:', error);
        return [];
    }
}

// Fonction pour récupérer une page statique spécifique
export async function getStaticPage(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/static/pages/${slug}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching static page ${slug}:`, error);
        return null;
    }
}