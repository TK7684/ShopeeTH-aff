<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

This approach provides:
- Preconnecting to font domains for faster loading
- Loading multiple weights (300, 400, 500, 600, 700)
- Using `display=swap` for better perceived performance
- Fallback to system fonts if the custom font fails to load

### 2. CSS Implementation

We've created a dedicated CSS file (`assets/css/main.css`) with:

```css
:root {
  --font-primary: "IBM Plex Sans Thai Looped", sans-serif;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}

html, body {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}
```

Benefits of this approach:
- CSS variables for consistent font weights
- Semantic application of font weights to different elements
- Fallback to sans-serif if the font fails to load
- Consistent line height for better readability

### 3. Nuxt Configuration

Updated `nuxt.config.ts` to include the CSS file:

```typescript
export default defineNuxtConfig({
  css: ["~/assets/css/main.css"],
  // ... rest of configuration
});
```

### 4. Component Updates

Updated all Vue components to explicitly use the font:

#### pages/index.vue
```vue
<style scoped>
.header, .container, .controls, .filter-controls, .form-group,
label, input, select, button, .button-group, .stats, .stat-card,
.stat-card h3, .value, .results, .loading, .no-results,
.error, .products-table, .products-table th, .products-table td,
.products-table tr, .products-table img, .badge, .product-link {
  font-family: "IBM Plex Sans Thai Looped", sans-serif;
}
</style>
```

#### app/app.vue
```vue
<template>
  <div style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
```

#### public/_app.js
```javascript
// Added to root element
document.documentElement.style.fontFamily =
  "'IBM Plex Sans Thai Looped', sans-serif";
```

## Font Weight Strategy

We're using the following semantic mapping for font weights:

- **300 (Light)**: Used for subtitle text and light content
- **400 (Regular)**: Default weight for body text
- **500 (Medium)**: Used for buttons and interactive elements
- **600 (Semi Bold)**: Used for labels and form elements
- **700 (Bold)**: Used for headings and emphasized text

## Benefits for Thai Users

### 1. Improved Readability
- Proper Thai character shaping with correct looped forms
- Optimized line height and spacing for Thai scripts
- Clearer distinction between similar characters

### 2. Professional Appearance
- Modern, clean typeface that matches current design trends
- Consistent typography throughout the application
- Better visual hierarchy with proper weight usage

### 3. Enhanced User Experience
- Faster perceived load time with font-display: swap
- Better accessibility with semantic font weight usage
- Consistent experience across all platforms

## Testing

Created a comprehensive test file (`test-font.html`) to verify:

1. Font loading and rendering
2. Thai character display
3. All font weights (300-700)
4. Component rendering with the new font
5. Responsive behavior on different devices

## Performance Considerations

1. **Preloading**: Using `preconnect` to establish early connections to font domains
2. **Font Subsetting**: Consider subsetting to Thai characters only for production
3. **Font Formats**: Currently using WOFF2 via Google Fonts (optimal)
4. **Display Strategy**: Using `swap` to show text immediately with fallback, then swap

## Future Optimizations

1. **Self-Hosting**: Consider self-hosting for better control and performance
2. **Variable Fonts**: Implement variable font version for more design flexibility
3. **Critical Font Inlining**: Consider inlining critical font CSS in the HTML head
4. **Local Storage**: Cache fonts in localStorage for repeat visits

## Browser Compatibility

The implementation is compatible with:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports graceful fallback to system sans-serif fonts

## Implementation Checklist

- [x] Font files imported from Google Fonts
- [x] CSS variables defined for font weights
- [x] Nuxt configuration updated
- [x] All components updated with new font
- [x] Test file created for verification
- [x] Documentation completed
- [ ] Font preloading implemented
- [ ] Font subsetting considered for production
- [ ] Performance metrics collected

## Conclusion

The IBM Plex Sans Thai Looped font has been successfully integrated throughout the Shopee Product Analyzer application. This implementation significantly improves the display of Thai text and provides a more professional appearance for Thai users while maintaining the existing functionality and design of the application.