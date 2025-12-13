# Public Assets

## Important: OpenGraph Image

The `og-image.svg` file is a placeholder. For best compatibility with social media platforms, you should:

1. Convert the SVG to a PNG (1200x630 pixels)
2. Save it as `og-image.png` in this directory
3. Optionally create a custom design using tools like Figma or Canva

## Icons

- `favicon.svg` - Main favicon (SVG format for modern browsers)
- `favicon.ico` - Fallback favicon for older browsers (create from SVG)
- `apple-touch-icon.png` - Apple touch icon (180x180 pixels, create from SVG)

## SEO Files

- `robots.txt` - Search engine crawling instructions
- `sitemap.xml` - Site structure for search engines
- `manifest.json` - PWA manifest for installable web app

## Creating Missing Icons

Use an online tool or ImageMagick to convert the SVG favicon:

```bash
# Convert SVG to ICO (requires ImageMagick or similar)
convert favicon.svg -resize 32x32 favicon.ico

# Convert SVG to Apple Touch Icon
convert favicon.svg -resize 180x180 apple-touch-icon.png

# Convert OG image SVG to PNG
convert og-image.svg -resize 1200x630 og-image.png
```

Or use online tools:
- https://realfavicongenerator.net/
- https://www.canva.com/ (for custom OG image)
- https://www.figma.com/ (for custom OG image)
