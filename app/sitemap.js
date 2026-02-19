// app/sitemap.js
export default function sitemap() {
    // const baseUrl = 'https://workstationfocus.com';  // Update this
    const baseUrl = 'https://work-station-ten.vercel.app/';  // Update this
  
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/journal`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
    ];
  }
