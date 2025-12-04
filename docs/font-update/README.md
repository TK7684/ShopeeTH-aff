@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@300;400;500;600;700&display=swap");
```

### 2. Defined CSS Variables

Added CSS variables for consistent font usage:
```css
:root {
  --font-primary: "IBM Plex Sans Thai Looped", sans-serif;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 3. Updated Nuxt Configuration

Modified `nuxt.config.ts` to include the new CSS file:
```typescript
export default defineNuxtConfig({
  css: ["~/assets/css/main.css"],
  // ... rest of configuration
});
```

### 4. Updated Vue Components

#### pages/index.vue
Updated all text elements to use IBM Plex Sans Thai Looped in scoped styles:
```css
.header, .container, .controls, .filter-controls, .form-group,
label, input, select, button, .button-group, .stats, .stat-card,
.stat-card h3, .value, .results, .loading, .no-results,
.error, .products-table, .products-table th, .products-table td,
.products-table tr, .products-table img, .badge, .product-link {
  font-family: "IBM Plex Sans Thai Looped", sans-serif;
}
```

#### app/app.vue
Updated the root div to include the font family:
```vue
<template>
  <div style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
```

### 5. Updated Legacy JavaScript

Modified `public/_app.js` to include IBM Plex Sans Thai Looped in dynamically created elements:
```javascript
// Added to root element
document.documentElement.style.fontFamily =
  "'IBM Plex Sans Thai Looped', sans-serif";
```

## Implementation Benefits

### For Thai Users

1. **Better Readability**
   - Optimized for Thai character shapes
   - Improved looped Thai characters
   - Enhanced text clarity

2. **Improved User Experience**
   - More professional appearance
   - Consistent typography
   - Better language support

3. **Enhanced Accessibility**
   - Clearer text hierarchy
   - Better contrast
   - Improved readability at different sizes

### For Developers

1. **Maintainable Code**
   - CSS variables for font weights
   - Consistent naming conventions
   - Clear separation of concerns

2. **Future-Proof Implementation**
   - Easy to modify font weights
   - Scalable for additional fonts
   - Compatible with existing architecture

## Font Details

### Font Family
- **Name**: IBM Plex Sans Thai Looped
- **Weights Available**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi Bold), 700 (Bold)
- **Script Support**: Thai characters (สวัสดี ภาษาไทย)
- **Fallback**: sans-serif

### CSS Variables
```css
:root {
  --font-primary: "IBM Plex Sans Thai Looped", sans-serif;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Implementation Approach

1. **Import from Google Fonts**
   - Used Google Fonts CDN for reliable loading
   - Included display=swap for better performance
   - Added all necessary weights

2. **Global Application**
   - Applied font to HTML, body, and all elements
   - Used semantic font weights for different elements
   - Ensured consistent application across all components

3. **Component Specific Updates**
   - Added explicit font-family to Vue components
   - Maintained scoped styles while updating fonts
   - Preserved existing functionality

4. **Fallback Support**
   - Included sans-serif as fallback
   - Ensured graceful degradation
   - Maintained readability across devices

## Testing

### Verification Steps

1. Run the application locally
2. Open `test-font.html` in a browser
3. Verify Thai characters display correctly
4. Check font weights render properly
5. Test responsive behavior on different devices

### Test File

Created a comprehensive test file (`test-font.html`) to verify:
- Font loading and rendering
- Thai character display
- Font weights rendering
- Component examples with the new font

### Expected Results

- All text elements should display in IBM Plex Sans Thai Looped
- Thai characters should render correctly with proper loops
- Font weights should apply correctly to different elements
- No impact on existing functionality

## Performance Considerations

1. **Font Loading Strategy**
   - Using Google Fonts CDN with preconnect for faster loading
   - Display=swap for better perceived performance
   - Loading only necessary weights (300, 400, 500, 600, 700)

2. **Optimization Opportunities**
   - Consider self-hosting for production
   - Subset font to Thai characters only
   - Use WOFF2 format for better compression
   - Implement font-display: swap for critical fonts

## Browser Compatibility

The implementation is compatible with:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports graceful fallback to system sans-serif fonts

## Conclusion

The IBM Plex Sans Thai Looped font has been successfully integrated throughout the Shopee Product Analyzer application. This update significantly improves the display of Thai text and provides a more professional appearance for Thai users while maintaining backward compatibility with existing styles.