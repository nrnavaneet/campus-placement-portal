# Public Directory

## Overview
This directory contains static assets served directly to the browser. Files placed here are publicly accessible and cached by CDN for optimal performance.

## Directory Structure

### Images

**Logo Files**
- `placeholder-logo.png` - PNG format logo (raster)
- `placeholder-logo.svg` - SVG format logo (vector, preferred)
- Displayed in navigation bar and marketing pages
- Recommended size: 180x60px for header

**Placeholder Images**
- `placeholder.jpg` - Default image placeholder (raster)
- `placeholder.svg` - Vector placeholder (scalable)
- Used as fallbacks when images are unavailable
- Maintains aspect ratio and layout

**User Images**
- `placeholder-user.jpg` - Default profile picture
- Used for students without uploaded photos
- Square format (1:1 aspect ratio)
- Recommended size: 200x200px minimum

### Favicon and App Icons

Complete favicon set for cross-platform compatibility.

**Standard Favicons**
- `favicon.ico` - Legacy ICO format (16x16, 32x32)
- `favicon.svg` - Modern SVG favicon (scalable)
- `favicon-16x16.png` - Small icon for browser tabs
- `favicon-32x32.png` - Standard size for most browsers

**Mobile and App Icons**
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `android-chrome-192x192.png` - Android home screen icon
- Used when users add site to home screen
- Rounded corners applied automatically by OS

**Favicon Design**
Current icon features:
- Blue circular background (brand color: #1e40af)
- Graduation cap symbol (education focus)
- University building representation (institution)
- Golden tassel accent (achievement)
- Professional and recognizable design

### Progressive Web App (PWA)

**`site.webmanifest`**
Defines PWA behavior and appearance.

Configuration includes:
```json
{
  "name": "Campus Placement Portal",
  "short_name": "Campus Portal",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [...]
}
```

Features enabled:
- Add to home screen
- Standalone app mode
- Custom splash screen
- Offline capability support
- App-like experience on mobile

### SEO and Crawlers

**`robots.txt`**
Search engine crawler instructions.

Current configuration:
```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

Controls:
- Which pages crawlers can access
- Crawl rate and frequency
- Sitemap location
- Privacy settings

## Usage Guidelines

### Adding New Images

1. **Optimize Before Upload**
   - Compress images to reduce file size
   - Use appropriate formats (JPEG for photos, PNG for graphics, SVG for logos)
   - Maintain reasonable dimensions

2. **Naming Conventions**
   - Use lowercase with hyphens: `student-banner.jpg`
   - Be descriptive: `job-posting-default.png`
   - Include dimensions if multiple sizes: `logo-sm.png`, `logo-lg.png`

3. **File Organization**
   - Keep root public directory clean
   - Create subdirectories for categories if needed
   - Document purpose of each file

### Image Optimization

**Recommended Tools:**
- TinyPNG for PNG compression
- ImageOptim for batch optimization
- SVGO for SVG optimization
- Next.js Image Optimization API

**Best Practices:**
- Use WebP format for modern browsers
- Provide fallbacks for older browsers
- Lazy load images below the fold
- Use responsive images with srcset

### Accessing Public Files

In Next.js, reference public files from root:

```tsx
// Correct
<img src="/placeholder-logo.svg" alt="Logo" />

// Incorrect (don't include 'public')
<img src="/public/placeholder-logo.svg" alt="Logo" />
```

In CSS:
```css
background-image: url('/placeholder.jpg');
```

### Next.js Image Component

Use Next.js Image component for optimization:

```tsx
import Image from 'next/image'

<Image 
  src="/placeholder-logo.svg"
  alt="Campus Portal Logo"
  width={180}
  height={60}
  priority // For above-fold images
/>
```

Benefits:
- Automatic format optimization
- Lazy loading by default
- Responsive image sizing
- Blur placeholder support

## Favicon Implementation

Favicons are automatically loaded by browsers from these locations:
- `/favicon.ico` - Legacy browsers
- `/favicon.svg` - Modern browsers (scalable)
- Apple and Android icons loaded via manifest

Configured in `app/layout.tsx`:
```tsx
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32' }
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico'
  }
}
```

## PWA Features

### Installing the App

Users can install the portal as an app:
1. Visit site on mobile device
2. Click "Add to Home Screen"
3. Icon appears on home screen
4. Opens in standalone mode (no browser UI)

### Manifest Configuration

Edit `site.webmanifest` to customize:
- App name and short name
- Theme colors
- Display mode (standalone, fullscreen, minimal-ui)
- Orientation preferences
- Start URL

### Offline Support

For full PWA support, implement service worker:
- Cache critical assets
- Offline fallback pages
- Background sync
- Push notifications

## SEO Optimization

### Robots.txt Guidelines

Allow important pages:
```
Allow: /
Allow: /jobs
Allow: /about
```

Disallow private areas:
```
Disallow: /admin
Disallow: /api
Disallow: /dashboard
```

### Sitemap Generation

Generate sitemap for better indexing:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/jobs</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Performance Considerations

### Caching

Public files are cached by default:
- Set appropriate cache headers
- Use versioning for updates
- Leverage CDN caching

### File Sizes

Recommended maximum sizes:
- Images: < 200KB
- Icons: < 50KB
- SVGs: < 10KB

### Loading Strategy

1. Critical assets: Preload
2. Above-fold images: Priority loading
3. Below-fold images: Lazy loading
4. Decorative images: Lowest priority

## Security Notes

### Public vs Private

Remember: Everything in /public is publicly accessible.

**Safe to put in public:**
- Logos and branding
- Marketing images
- Generic placeholders
- Favicon files
- robots.txt

**Never put in public:**
- User uploaded files
- Private documents
- API keys or credentials
- Personal data
- Sensitive information

### User Uploads

Store user-uploaded content separately:
- Use Supabase Storage
- Implement access controls
- Check file types and sizes
- Scan for malicious content

## Maintenance

### Regular Tasks

1. **Audit unused files** - Remove old assets
2. **Optimize images** - Re-compress periodically
3. **Check broken links** - Verify all references
4. **Update favicons** - Refresh for rebranding
5. **Review robots.txt** - Update for new pages

### Monitoring

Check:
- File sizes and load times
- 404 errors for missing assets
- CDN cache hit rates
- Image optimization opportunities

## Future Enhancements

Consider adding:
- Multiple logo variants (dark mode, compact)
- Social media share images
- Multiple favicon sizes
- Custom 404 page image
- Loading animations
- Brand asset kit
