/**
 * @type {import('next').MetadataRoute.Robots}
 */
export default function robots() {
    // TODO: Replace this with your actual production domain
    // const baseUrl = 'https://workstationfocus.com'; 
    const baseUrl = 'https://work-station-ten.vercel.app/';  // Update this
  
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',                  // Hide backend API routes
          '/auth/',                 // Hide authentication callback routes
          '/journal/',              // Hide private user content (Journal/Dashboard)
          '/subscription-complete/', // Hide post-payment success pages
          '/test-subscription/',    // Hide testing routes
        ],
      },
      sitemap: `${baseUrl}/sitemap.xml`, // Links to the sitemap we will create next
    };
  }