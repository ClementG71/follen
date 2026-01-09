/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        follen: {
          red: '#D1495B',    // Principal / Institutionnel
          yellow: '#EDAE49', // Intérieur / Accent
          green: '#43AA8B',  // Agriculture
          blue: '#2374AB',   // Écologie
          
          // Variantes claires générées (approximations pour les fonds)
          'red-light': '#FBE6EA',
          'yellow-light': '#FCF0DB',
          'green-light': '#D9EFE9',
          'blue-light': '#D3E3EF',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
