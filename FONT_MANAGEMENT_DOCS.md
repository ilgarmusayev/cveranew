# CV Şrift İdarəsi Sistemi

Bu sistem CV aplikasiyası üçün peşəkar şrift idarəsi imkanları təqdim edir.

## Xüsusiyyətlər

### 🎨 Geniş Şrift Seçimi
- **Serif Şriftləri**: Times New Roman, Georgia, Crimson Text, Playfair Display
- **Sans-serif Şriftləri**: Arial, Helvetica, Open Sans, Lato, Inter, Montserrat
- **Monospace Şriftləri**: Courier New, Fira Code (proqramçılar üçün)

### ⚙️ Ətraflı Tənzimlər
- Şrift ölçüsü (9-16pt)
- Sətir hündürlüyü (1.0-2.0)
- Hərf aralığı (-1px-3px)
- Ayrı başlıq və mətn şriftləri

### 🎯 Hazır Kombinasiyalar
- Klassik Professional
- Modern Minimalist
- Creative Elegant
- Corporate Clean
- Technical Focus

### 💎 Premium Xüsusiyyətlər
- Əlavə Google Fonts
- Yaradıcı şrift kombinasiyaları
- Advanced tipografi tənzimləri

## İstifadə Qaydası

### 1. Komponentlərin İmportu

```typescript
import FontManagementPanel from './components/cv/FontManagementPanel';
import { useFontSettings } from './hooks/useFontSettings';
```

### 2. CV Editorunda İstifadə

```tsx
function CVEditor({ cvId, isPremium }) {
  return (
    <div>
      {/* Digər CV editor komponentləri */}
      
      <FontManagementPanel 
        cvId={cvId}
        isPremium={isPremium}
        onClose={() => console.log('Font settings applied')}
      />
    </div>
  );
}
```

### 3. Hook ilə Şrift Tənzimlərinin İdarəsi

```typescript
function MyComponent({ cvId }) {
  const { fontSettings, updateFontSettings, isLoading, error } = useFontSettings(cvId);
  
  const handleFontChange = () => {
    updateFontSettings({
      headingFont: 'inter',
      bodyFont: 'open-sans',
      fontSize: 12,
      lineHeight: 1.5,
      letterSpacing: 0
    });
  };
}
```

## CSS Siniflər

Şrift sistemi aşağıdakı CSS siniflərini avtomatik olaraq tətbiq edir:

```css
.cv-heading     /* Əsas başlıqlar üçün */
.cv-subheading  /* Alt başlıqlar üçün */
.cv-body        /* Əsas mətn üçün */
.cv-small       /* Kiçik mətn üçün */
```

## Şrift Tənzimləri Strukturu

```typescript
interface FontSettings {
  headingFont: string;    // Başlıq şrifti ID-si
  bodyFont: string;       // Mətn şrifti ID-si
  fontSize: number;       // Əsas şrift ölçüsü (pt)
  lineHeight: number;     // Sətir hündürlüyü
  letterSpacing: number;  // Hərf aralığı (px)
}
```

## Mövcud Şriftlər

### Pulsuz Şriftlər
- Times New Roman
- Arial
- Helvetica
- Georgia
- Courier New

### Premium Şriftlər (Google Fonts)
- Open Sans
- Inter
- Montserrat
- Lato
- Crimson Text
- Playfair Display
- Fira Code

## Avtomatik Şrift Yükləmə

Sistem Google Fonts-dan şriftləri avtomatik olaraq yükləyir:

```typescript
// Avtomatik yüklənir
const fontManager = FontManager.getInstance();
await fontManager.loadGoogleFont(fontOption);
```

## Yerli Yaddaş

Şrift tənzimləri avtomatik olaraq localStorage-də saxlanır:
- Ümumi tənzimlər: `cvFontSettings`
- CV-spesifik tənzimlər: `cvFontSettings_{cvId}`

## Responsive Dizayn

Şrift sistemi bütün cihazlarda uyğun şəkildə işləyir və mobile-friendly interfeys təqdim edir.

## Performans Optimizasiyası

- Lazy loading Google Fonts
- CSS-in dinamik inject edilməsi
- Singleton pattern FontManager
- Minimal re-render

## Gələcək Genişləndirmələr

- Daha çox şrift seçimi
- AI-powered şrift tövsiyələri
- Şrift preview real-time
- Export edilmiş PDF-də şrift saxlanması
- Şrift analytics və istifadə statistikası

## Misal Kod

Tam funksional misal:

```tsx
import React from 'react';
import FontManagementPanel from './components/cv/FontManagementPanel';

function CVApp() {
  const handleFontApplied = () => {
    console.log('Şriftlər uğurla tətbiq edildi!');
  };

  return (
    <div className="cv-app">
      <header>
        <FontManagementPanel 
          cvId="user-cv-123"
          isPremium={true}
          onClose={handleFontApplied}
        />
      </header>
      
      <main className="cv-preview">
        <h1 className="cv-heading">CV Başlığı</h1>
        <p className="cv-body">CV mətn məzmunu...</p>
      </main>
    </div>
  );
}
```

Bu sistem tamamilə hazırdır və istifadəyə yararlıdır!
