export const siteConfig = {
  name: 'Business Sarthi',
  tagline: 'Driving Business Forward',
  url: import.meta.env.VITE_WEBSITE_URL || 'https://businesssarthi.com',
  appUrl: import.meta.env.VITE_APP_URL || 'https://app.businesssarthi.com',
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.businesssarthi.com/api/v1',
  contact: {
    email: 'contact@businesssarthi.com',
    phone: '+977-9800000000',
    address: 'Koteshwor-32, Kathmandu, Nepal',
  },
  links: {
    login: `${import.meta.env.VITE_APP_URL || 'https://app.businesssarthi.com'}/login`,
    register: `${import.meta.env.VITE_APP_URL || 'https://app.businesssarthi.com'}/register`,
    facebook: '#',
    twitter: '#',
    linkedin: '#',
  },
};
