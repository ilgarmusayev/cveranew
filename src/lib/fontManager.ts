// Font Management System for CV Application
export interface FontOption {
  id: string;
  name: string;
  displayName: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display';
  fontFamily: string;
  googleFont?: string;
  weight?: string[];
  preview: string;
  description: string;
  isPremium?: boolean;
  fallback?: string;
  loadPriority?: 'high' | 'medium' | 'low';
  suitableFor?: string[];
}

export interface FontSettings {
  headingFont: string;
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight?: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  fontSizes?: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  colors?: {
    primary: string;    // Main text color (black/dark gray)
    secondary: string;  // Dates, locations (medium gray)
    accent: string;     // Section headers, highlights (blue, green, etc.)
    background: string; // Background color (white)
  };
  spacing?: {
    sectionMarginTop: number;    // Space before section headers (18pt)
    sectionMarginBottom: number; // Space after section headers (8pt)
    paragraphMargin: number;     // Between paragraphs/jobs (8-10pt)
    bulletMargin: number;        // Between bullet points (4-6pt)
    itemMargin: number;          // Between work experiences (8-10pt)
  };
}

// Professional CV Color Palette
export const CV_COLOR_PALETTE = {
  // Text Colors (as per CV standards)
  text: {
    primary: '#222222',     // Main content - dark gray (#222)
    secondary: '#333333',   // Alternative dark gray (#333)  
    muted: '#666666',       // Dates, locations - medium gray
    light: '#888888'        // Subtle information
  },
  
  // Accent Colors (single accent color recommendation)
  accent: {
    blue: '#2563eb',        // Professional blue
    navy: '#1e40af',        // Navy blue
    green: '#059669',       // Professional green
    teal: '#0891b2',        // Modern teal
    gray: '#374151',        // Professional dark gray
    black: '#000000'        // Classic black
  },
  
  // Background
  background: {
    white: '#ffffff',       // Clean white
    light: '#fafafa'        // Very light gray
  }
};

// Professional font options for CV - Expanded collection
export const FONT_OPTIONS: FontOption[] = [
  // === SERIF FONTS - Professional for traditional CVs ===
  {
    id: 'times',
    name: 'Times New Roman',
    displayName: 'Times New Roman',
    category: 'serif',
    fontFamily: '"Times New Roman", Times, serif',
    weight: ['400', '700'],
    preview: 'Professional, traditional və klassik görünüş üçün ideal',
    description: 'Ənənəvi və peşəkar CV-lər üçün ən məşhur seçim',
    fallback: 'Times, serif',
    loadPriority: 'high',
    suitableFor: ['law', 'finance', 'academia', 'government']
  },
  {
    id: 'georgia',
    name: 'Georgia',
    displayName: 'Georgia',
    category: 'serif',
    fontFamily: 'Georgia, "Times New Roman", serif',
    weight: ['400', '700'],
    preview: 'Oxunması asan və modern serif şrift',
    description: 'Həm çap, həm də ekranda əla görünən serif şrift',
    fallback: '"Times New Roman", serif',
    loadPriority: 'high',
    suitableFor: ['journalism', 'publishing', 'education', 'consulting']
  },
  {
    id: 'crimson',
    name: 'Crimson Text',
    displayName: 'Crimson Text',
    category: 'serif',
    fontFamily: '"Crimson Text", Georgia, serif',
    googleFont: 'Crimson+Text:400,600,700',
    weight: ['400', '600', '700'],
    preview: 'Zərif və oxunması asan serif dizayn',
    description: 'Akademik və peşəkar sənədlər üçün ideal',
    isPremium: true,
    fallback: 'Georgia, serif',
    loadPriority: 'medium',
    suitableFor: ['academia', 'research', 'literature', 'history']
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    displayName: 'Playfair Display',
    category: 'serif',
    fontFamily: '"Playfair Display", Georgia, serif',
    googleFont: 'Playfair+Display:400,600,700',
    weight: ['400', '600', '700'],
    preview: 'Yaradıcı və zərif başlıqlar üçün',
    description: 'Dizayn və yaradıcı sahələr üçün mükəmməl',
    isPremium: true,
    fallback: 'Georgia, serif',
    loadPriority: 'medium',
    suitableFor: ['design', 'art', 'fashion', 'luxury']
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    displayName: 'Libre Baskerville',
    category: 'serif',
    fontFamily: '"Libre Baskerville", Georgia, serif',
    googleFont: 'Libre+Baskerville:400,700',
    weight: ['400', '700'],
    preview: 'Klassik və zərif serif tərzində',
    description: 'Ənənəvi görünüş istəyənlər üçün modern alternativ',
    isPremium: true,
    fallback: 'Georgia, serif',
    loadPriority: 'medium',
    suitableFor: ['literature', 'publishing', 'academia', 'law']
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    displayName: 'Merriweather',
    category: 'serif',
    fontFamily: 'Merriweather, Georgia, serif',
    googleFont: 'Merriweather:400,700',
    weight: ['400', '700'],
    preview: 'Oxunması asan və professional serif',
    description: 'Uzun mətnlər üçün optimallaşdırılmış',
    isPremium: true,
    fallback: 'Georgia, serif',
    loadPriority: 'medium',
    suitableFor: ['journalism', 'writing', 'consulting', 'research']
  },

  // === SANS-SERIF FONTS - Modern and clean ===
  {
    id: 'arial',
    name: 'Arial',
    displayName: 'Arial',
    category: 'sans-serif',
    fontFamily: 'Arial, sans-serif',
    weight: ['400', '700'],
    preview: 'Sadə, təmiz və universal',
    description: 'Bütün platformalarda eyni görünən etibarlı seçim',
    fallback: 'sans-serif',
    loadPriority: 'high',
    suitableFor: ['general', 'business', 'corporate', 'healthcare']
  },
  {
    id: 'calibri',
    name: 'Calibri',
    displayName: 'Calibri',
    category: 'sans-serif',
    fontFamily: 'Calibri, Arial, sans-serif',
    weight: ['400', '700'],
    preview: 'Modern və oxunaqlı Microsoft font',
    description: 'CV-lər üçün ən ideal font - professional və təmiz görünüş',
    fallback: 'Arial, sans-serif',
    loadPriority: 'high',
    suitableFor: ['business', 'corporate', 'general', 'professional', 'cv', 'resume']
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    displayName: 'Helvetica',
    category: 'sans-serif',
    fontFamily: 'Helvetica, Arial, sans-serif',
    weight: ['400', '700'],
    preview: 'Klassik Swiss dizayn',
    description: 'Professional və minimal görünüş üçün ideal',
    fallback: 'Arial, sans-serif',
    loadPriority: 'high',
    suitableFor: ['design', 'architecture', 'consulting', 'finance']
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    displayName: 'Open Sans',
    category: 'sans-serif',
    fontFamily: '"Open Sans", Arial, sans-serif',
    googleFont: 'Open+Sans:400,600,700',
    weight: ['400', '600', '700'],
    preview: 'Dost-canlısı və oxunması asan',
    description: 'Modern CV-lər üçün ən populyar seçim',
    fallback: 'Arial, sans-serif',
    loadPriority: 'high',
    suitableFor: ['tech', 'startup', 'nonprofit', 'education']
  },
  {
    id: 'lato',
    name: 'Lato',
    displayName: 'Lato',
    category: 'sans-serif',
    fontFamily: 'Lato, Arial, sans-serif',
    googleFont: 'Lato:400,700',
    weight: ['400', '700'],
    preview: 'Professional və müasir',
    description: 'Korporativ mühit üçün mükəmməl',
    fallback: 'Arial, sans-serif',
    loadPriority: 'medium',
    suitableFor: ['corporate', 'business', 'finance', 'consulting']
  },
  {
    id: 'inter',
    name: 'Inter',
    displayName: 'Inter',
    category: 'sans-serif',
    fontFamily: 'Inter, Arial, sans-serif',
    googleFont: 'Inter:400,500,600,700',
    weight: ['400', '500', '600', '700'],
    preview: 'Müasir və texnoloji görünüş',
    description: 'IT və texnoloji sahələr üçün ideal',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'medium',
    suitableFor: ['tech', 'software', 'ai', 'data-science']
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    displayName: 'Montserrat',
    category: 'sans-serif',
    fontFamily: 'Montserrat, Arial, sans-serif',
    googleFont: 'Montserrat:400,500,600,700',
    weight: ['400', '500', '600', '700'],
    preview: 'Güclü və diqqət çəkən',
    description: 'Lidərlik vəzifələri üçün əla seçim',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'medium',
    suitableFor: ['leadership', 'management', 'sales', 'marketing']
  },
  {
    id: 'roboto',
    name: 'Roboto',
    displayName: 'Roboto',
    category: 'sans-serif',
    fontFamily: 'Roboto, Arial, sans-serif',
    googleFont: 'Roboto:400,500,700',
    weight: ['400', '500', '700'],
    preview: 'Modern və dəqiq görünüş',
    description: 'Google tərəfindən hazırlanmış müasir şrift',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'medium',
    suitableFor: ['tech', 'engineering', 'product', 'ux-ui']
  },
  {
    id: 'source-sans',
    name: 'Source Sans Pro',
    displayName: 'Source Sans Pro',
    category: 'sans-serif',
    fontFamily: '"Source Sans Pro", Arial, sans-serif',
    googleFont: 'Source+Sans+Pro:400,600,700',
    weight: ['400', '600', '700'],
    preview: 'Təmiz və professional',
    description: 'Adobe tərəfindən hazırlanmış keyfiyyətli şrift',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'medium',
    suitableFor: ['design', 'creative', 'media', 'advertising']
  },
  {
    id: 'nunito',
    name: 'Nunito',
    displayName: 'Nunito',
    category: 'sans-serif',
    fontFamily: 'Nunito, Arial, sans-serif',
    googleFont: 'Nunito:400,600,700',
    weight: ['400', '600', '700'],
    preview: 'Dost-canlısı və yumşaq',
    description: 'İnsani və mehriban görünüş üçün',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'low',
    suitableFor: ['healthcare', 'education', 'nonprofit', 'social-work']
  },

  // === MONOSPACE FONTS - For technical CVs ===
  {
    id: 'courier',
    name: 'Courier New',
    displayName: 'Courier New',
    category: 'monospace',
    fontFamily: '"Courier New", Courier, monospace',
    weight: ['400', '700'],
    preview: 'Texniki və proqramlaşdırma',
    description: 'Proqramçılar və texniki mütəxəssislər üçün',
    fallback: 'monospace',
    loadPriority: 'high',
    suitableFor: ['programming', 'engineering', 'data', 'cybersecurity']
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    displayName: 'Fira Code',
    category: 'monospace',
    fontFamily: '"Fira Code", "Courier New", monospace',
    googleFont: 'Fira+Code:400,500,600',
    weight: ['400', '500', '600'],
    preview: 'Modern proqramlaşdırma şrifti',
    description: 'Software developers üçün ən yaxşı seçim',
    isPremium: true,
    fallback: '"Courier New", monospace',
    loadPriority: 'medium',
    suitableFor: ['software', 'web-dev', 'mobile-dev', 'devops']
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    displayName: 'JetBrains Mono',
    category: 'monospace',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    googleFont: 'JetBrains+Mono:400,500,600',
    weight: ['400', '500', '600'],
    preview: 'Professional kodlaşdırma şrifti',
    description: 'IDE-lər üçün optimallaşdırılmış',
    isPremium: true,
    fallback: '"Courier New", monospace',
    loadPriority: 'medium',
    suitableFor: ['software', 'full-stack', 'backend', 'systems']
  },

  // === DISPLAY FONTS - For creative headings ===
  {
    id: 'oswald',
    name: 'Oswald',
    displayName: 'Oswald',
    category: 'display',
    fontFamily: 'Oswald, Arial, sans-serif',
    googleFont: 'Oswald:400,500,600,700',
    weight: ['400', '500', '600', '700'],
    preview: 'Güclü və impaktlı başlıqlar',
    description: 'Diqqət çəkən başlıqlar üçün ideal',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'low',
    suitableFor: ['marketing', 'sales', 'sports', 'entertainment']
  },
  {
    id: 'poppins',
    name: 'Poppins',
    displayName: 'Poppins',
    category: 'display',
    fontFamily: 'Poppins, Arial, sans-serif',
    googleFont: 'Poppins:400,500,600,700',
    weight: ['400', '500', '600', '700'],
    preview: 'Modern və stilizə edilmiş',
    description: 'Yaradıcı sahələr üçün trend şrift',
    isPremium: true,
    fallback: 'Arial, sans-serif',
    loadPriority: 'low',
    suitableFor: ['design', 'creative', 'startup', 'innovation']
  }
];

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  headingFont: 'calibri', // Calibri as preferred modern font
  bodyFont: 'calibri',
  fontSize: 11, // Ideal body text size (10.5-11.5 pt range)
  lineHeight: 1.15, // Optimal readability range (1.15-1.3)
  letterSpacing: 0,
  fontWeight: {
    heading: 700,     // Bold for main heading (Name)
    subheading: 700,  // Bold for section headers
    body: 400,        // Regular for body text
    small: 400        // Regular for dates/locations
  },
  fontSizes: {
    heading: 20,      // Name/Main title: 18-22 pt (optimal 20 pt)
    subheading: 13,   // Section headers: 12-14 pt (optimal 13 pt)
    body: 11,         // Main content: 10.5-11.5 pt (optimal 11 pt)
    small: 10         // Dates/locations: 9-10 pt (optimal 10 pt)
  },
  colors: {
    primary: '#222222',     // Main text - dark gray for readability
    secondary: '#666666',   // Secondary text - medium gray for dates/locations
    accent: '#2563eb',      // Accent color - professional blue for headers
    background: '#ffffff'   // Background - clean white
  },
  spacing: {
    sectionMarginTop: 18,     // Space before section headers (18pt)
    sectionMarginBottom: 8,   // Space after section headers (8pt)
    paragraphMargin: 9,       // Between paragraphs (8-10pt, optimal 9pt)
    bulletMargin: 5,          // Between bullet points (4-6pt, optimal 5pt)
    itemMargin: 10            // Between work experiences (8-10pt, optimal 10pt)
  }
};

export class FontManager {
  private static instance: FontManager;
  private loadedFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<void>> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  // Enhanced Google Fonts loading with retry mechanism and error handling
  async loadGoogleFont(fontOption: FontOption): Promise<void> {
    if (!fontOption.googleFont || this.loadedFonts.has(fontOption.googleFont)) {
      return;
    }

    // Check if already loading
    if (this.fontLoadPromises.has(fontOption.googleFont)) {
      return this.fontLoadPromises.get(fontOption.googleFont);
    }

    const loadPromise = this.performFontLoad(fontOption);
    this.fontLoadPromises.set(fontOption.googleFont, loadPromise);

    try {
      await loadPromise;
      this.loadedFonts.add(fontOption.googleFont);
    } catch (error) {
      console.warn(`Failed to load font ${fontOption.displayName}:`, error);
      // Font loading failed, but we continue with fallback
    } finally {
      this.fontLoadPromises.delete(fontOption.googleFont);
    }
  }

  private async performFontLoad(fontOption: FontOption): Promise<void> {
    const attempts = this.retryAttempts.get(fontOption.googleFont!) || 0;

    if (attempts >= this.maxRetries) {
      console.warn(`Max retry attempts reached for ${fontOption.displayName}, using fallback`);
      return; // Don't throw error, just use fallback
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      // Improved Google Fonts URL format
      const fontFamily = fontOption.googleFont!.replace(/\+/g, '+');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        try {
          document.head.removeChild(link);
        } catch (e) {
          // Link might already be removed
        }
        this.retryAttempts.set(fontOption.googleFont!, attempts + 1);
        console.warn(`Font loading timeout for ${fontOption.displayName}, attempt ${attempts + 1}`);
        reject(new Error(`Font loading timeout for ${fontOption.displayName}`));
      }, 5000); // Reduced timeout to 5 seconds

      link.onload = () => {
        clearTimeout(timeout);
        this.retryAttempts.delete(fontOption.googleFont!);
        console.log(`Successfully loaded font: ${fontOption.displayName}`);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeout);
        try {
          document.head.removeChild(link);
        } catch (e) {
          // Link might already be removed
        }
        this.retryAttempts.set(fontOption.googleFont!, attempts + 1);
        console.warn(`Failed to load font ${fontOption.displayName}, attempt ${attempts + 1}, using fallback`);

        // Don't reject on error, just resolve and use fallback
        resolve();
      };

      document.head.appendChild(link);
    });
  }

  // Preload high priority fonts
  async preloadEssentialFonts(): Promise<void> {
    const highPriorityFonts = FONT_OPTIONS.filter(font =>
      font.loadPriority === 'high' && font.googleFont
    );

    const loadPromises = highPriorityFonts.map(font => this.loadGoogleFont(font));
    await Promise.allSettled(loadPromises);
  }

  // Get font option by ID
  getFontOption(fontId: string): FontOption | undefined {
    return FONT_OPTIONS.find(font => font.id === fontId);
  }

  // Get font options by category
  getFontsByCategory(category: 'serif' | 'sans-serif' | 'monospace' | 'display'): FontOption[] {
    return FONT_OPTIONS.filter(font => font.category === category);
  }

  // Get premium fonts
  getPremiumFonts(): FontOption[] {
    return FONT_OPTIONS.filter(font => font.isPremium);
  }

  // Generate CSS for font settings
  generateFontCSS(settings: FontSettings): string {
    const headingFont = this.getFontOption(settings.headingFont);
    const bodyFont = this.getFontOption(settings.bodyFont);

    return `
      .cv-heading {
        font-family: ${headingFont?.fontFamily || 'Arial, sans-serif'};
        font-size: ${settings.fontSize + 2}pt;
        font-weight: 700;
        line-height: ${settings.lineHeight};
        letter-spacing: ${settings.letterSpacing}px;
      }
      
      .cv-subheading {
        font-family: ${headingFont?.fontFamily || 'Arial, sans-serif'};
        font-size: ${settings.fontSize + 1}pt;
        font-weight: 600;
        line-height: ${settings.lineHeight};
        letter-spacing: ${settings.letterSpacing}px;
      }
      
      .cv-body {
        font-family: ${bodyFont?.fontFamily || 'Arial, sans-serif'};
        font-size: ${settings.fontSize}pt;
        font-weight: 400;
        line-height: ${settings.lineHeight};
        letter-spacing: ${settings.letterSpacing}px;
      }
      
      .cv-small {
        font-family: ${bodyFont?.fontFamily || 'Arial, sans-serif'};
        font-size: ${settings.fontSize - 1}pt;
        font-weight: 400;
        line-height: ${settings.lineHeight};
        letter-spacing: ${settings.letterSpacing}px;
      }
    `;
  }

  // Apply font settings to CV
  async applyFontSettings(settings: FontSettings): Promise<void> {
    const headingFont = this.getFontOption(settings.headingFont);
    const bodyFont = this.getFontOption(settings.bodyFont);

    // Load Google Fonts if needed
    if (headingFont?.googleFont) {
      await this.loadGoogleFont(headingFont);
    }
    if (bodyFont?.googleFont && bodyFont.id !== headingFont?.id) {
      await this.loadGoogleFont(bodyFont);
    }

    // Create or update style element
    let styleElement = document.getElementById('cv-font-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'cv-font-styles';
      document.head.appendChild(styleElement);
    }

    // Use the enhanced CSS generation with better fallbacks
    styleElement.textContent = this.generateAdvancedFontCSS(settings);
  }

  // Check if user has premium access (placeholder for integration)
  checkPremiumAccess(): boolean {
    // This should be integrated with your premium system
    return true; // For now, allow all fonts
  }

  // Get recommended font combinations
  getRecommendedCombinations(): Array<{name: string, heading: string, body: string, description: string}> {
    return [
      {
        name: 'Klassik Professional',
        heading: 'times',
        body: 'times',
        description: 'Ənənəvi və etibarlı görünüş'
      },
      {
        name: 'Modern Minimalist',
        heading: 'inter',
        body: 'open-sans',
        description: 'Müasir və təmiz dizayn'
      },
      {
        name: 'Creative Elegant',
        heading: 'playfair',
        body: 'crimson',
        description: 'Yaradıcı sahələr üçün'
      },
      {
        name: 'Corporate Clean',
        heading: 'montserrat',
        body: 'lato',
        description: 'Korporativ mühit üçün'
      },
      {
        name: 'Technical Focus',
        heading: 'inter',
        body: 'fira-code',
        description: 'IT və texniki mütəxəssislər üçün'
      },
      {
        name: 'Academic Traditional',
        heading: 'libre-baskerville',
        body: 'merriweather',
        description: 'Akademik və tədqiqat sahələri üçün'
      },
      {
        name: 'Startup Dynamic',
        heading: 'poppins',
        body: 'roboto',
        description: 'Startap və innovativ şirkətlər üçün'
      },
      {
        name: 'Healthcare Professional',
        heading: 'nunito',
        body: 'open-sans',
        description: 'Səhiyyə və sosial sahələr üçün'
      },
      {
        name: 'Design Creative',
        heading: 'oswald',
        body: 'source-sans',
        description: 'Dizayn və yaradıcı industryalar üçün'
      },
      {
        name: 'Finance Conservative',
        heading: 'georgia',
        body: 'lato',
        description: 'Maliyyə və mühasibat sahələri üçün'
      }
    ];
  }

  // Get fonts suitable for specific profession
  getFontsForProfession(profession: string): FontOption[] {
    return FONT_OPTIONS.filter(font =>
      font.suitableFor?.includes(profession.toLowerCase())
    );
  }

  // Get all available categories
  getAvailableCategories(): Array<{id: string, name: string, count: number}> {
    const categories = ['serif', 'sans-serif', 'monospace', 'display'] as const;
    return categories.map(cat => ({
      id: cat,
      name: this.getCategoryDisplayName(cat),
      count: this.getFontsByCategory(cat as any).length
    }));
  }

  private getCategoryDisplayName(category: string): string {
    const names = {
      'serif': 'Serif (Klassik)',
      'sans-serif': 'Sans-serif (Modern)',
      'monospace': 'Monospace (Texniki)',
      'display': 'Display (Yaradıcı)'
    };
    return names[category as keyof typeof names] || category;
  }

  // Enhanced CSS generation with better fallbacks and responsive design
  generateAdvancedFontCSS(settings: FontSettings): string {
    const headingFont = this.getFontOption(settings.headingFont);
    const bodyFont = this.getFontOption(settings.bodyFont);
    const weights = settings.fontWeight || DEFAULT_FONT_SETTINGS.fontWeight!;
    const fontSizes = settings.fontSizes || DEFAULT_FONT_SETTINGS.fontSizes!;
    const colors = settings.colors || DEFAULT_FONT_SETTINGS.colors!;
    const spacing = settings.spacing || DEFAULT_FONT_SETTINGS.spacing!;

    const headingFallback = headingFont?.fallback || 'Arial, sans-serif';
    const bodyFallback = bodyFont?.fallback || 'Arial, sans-serif';

    return `
      /* Base font styles with enhanced fallbacks and higher specificity */
      .cv-container {
        font-feature-settings: "liga" 1, "kern" 1;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: ${colors.background};
        color: ${colors.primary};
      }

      /* CV Section Spacing - Professional Standards */
      .cv-section {
        margin-top: ${spacing.sectionMarginTop}pt !important;
        margin-bottom: ${spacing.sectionMarginBottom}pt !important;
      }

      .cv-section:first-child {
        margin-top: 0 !important;
      }

      .cv-section-header {
        margin-top: ${spacing.sectionMarginTop}pt !important;
        margin-bottom: ${spacing.sectionMarginBottom}pt !important;
        color: ${colors.accent} !important;
      }

      .cv-section-content {
        margin-bottom: ${spacing.paragraphMargin}pt !important;
      }

      /* Work Experience / Education Item Spacing */
      .cv-experience-item,
      .cv-education-item,
      .cv-project-item {
        margin-bottom: ${spacing.itemMargin}pt !important;
      }

      .cv-experience-item:last-child,
      .cv-education-item:last-child,
      .cv-project-item:last-child {
        margin-bottom: 0 !important;
      }

      /* Bullet Points and List Spacing */
      .cv-bullet-list li,
      .cv-responsibilities li,
      .cv-achievements li {
        margin-bottom: ${spacing.bulletMargin}pt !important;
      }

      .cv-bullet-list li:last-child,
      .cv-responsibilities li:last-child,
      .cv-achievements li:last-child {
        margin-bottom: 0 !important;
      }

      /* Paragraph Spacing */
      .cv-paragraph {
        margin-bottom: ${spacing.paragraphMargin}pt !important;
      }

      .cv-paragraph:last-child {
        margin-bottom: 0 !important;
      }

      .cv-heading,
      h1.cv-heading,
      h2.cv-heading,
      h3.cv-heading {
        font-family: ${headingFont?.fontFamily || headingFallback} !important;
        font-size: ${fontSizes.heading}pt !important;
        font-weight: ${weights.heading} !important;
        line-height: ${settings.lineHeight} !important;
        letter-spacing: ${settings.letterSpacing}px !important;
        color: ${colors.primary} !important;
        margin-bottom: 0.5em;
      }
      
      .cv-subheading,
      h1.cv-subheading,
      h2.cv-subheading,
      h3.cv-subheading,
      p.cv-subheading {
        font-family: ${headingFont?.fontFamily || headingFallback} !important;
        font-size: ${fontSizes.subheading}pt !important;
        font-weight: ${weights.subheading} !important;
        line-height: ${settings.lineHeight} !important;
        letter-spacing: ${settings.letterSpacing}px !important;
        color: ${colors.accent} !important;
        margin-bottom: 0.3em;
      }
      
      .cv-body,
      p.cv-body,
      div.cv-body,
      span.cv-body {
        font-family: ${bodyFont?.fontFamily || bodyFallback} !important;
        font-size: ${fontSizes.body}pt !important;
        font-weight: ${weights.body} !important;
        line-height: ${settings.lineHeight} !important;
        letter-spacing: ${settings.letterSpacing}px !important;
        color: ${colors.primary} !important;
        margin-bottom: 0.8em;
      }
      
      .cv-small,
      p.cv-small,
      div.cv-small,
      span.cv-small {
        font-family: ${bodyFont?.fontFamily || bodyFallback} !important;
        font-size: ${fontSizes.small}pt !important;
        font-weight: ${weights.body} !important;
        line-height: ${settings.lineHeight * 0.9} !important;
        letter-spacing: ${settings.letterSpacing}px !important;
        color: ${colors.secondary} !important;
      }

      .cv-emphasis,
      strong.cv-emphasis,
      b.cv-emphasis {
        font-family: ${bodyFont?.fontFamily || bodyFallback} !important;
        font-size: ${fontSizes.body}pt !important;
        font-weight: ${weights.subheading} !important;
        line-height: ${settings.lineHeight} !important;
        letter-spacing: ${settings.letterSpacing}px !important;
        color: ${colors.primary} !important;
      }

      /* Debug styles to ensure fonts are applied */
      .cv-heading::before { content: "/* Font: ${headingFont?.displayName || 'Default'} */"; display: none; }
      .cv-subheading::before { content: "/* Font: ${headingFont?.displayName || 'Default'} */"; display: none; }
      .cv-body::before { content: "/* Font: ${bodyFont?.displayName || 'Default'} */"; display: none; }

      /* Print optimizations */
      @media print {
        .cv-heading, .cv-subheading, .cv-body, .cv-small, .cv-emphasis {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }

      /* Responsive font sizing with higher specificity */
      @media screen and (max-width: 768px) {
        .cv-heading, h1.cv-heading, h2.cv-heading, h3.cv-heading {
          font-size: ${Math.max(settings.fontSize + 1, 12)}pt !important;
        }
        .cv-subheading, h1.cv-subheading, h2.cv-subheading, h3.cv-subheading, p.cv-subheading {
          font-size: ${Math.max(settings.fontSize, 11)}pt !important;
        }
        .cv-body, p.cv-body, div.cv-body, span.cv-body {
          font-size: ${Math.max(settings.fontSize - 0.5, 10)}pt !important;
        }
        .cv-small, p.cv-small, div.cv-small, span.cv-small {
          font-size: ${Math.max(settings.fontSize - 1.5, 9)}pt !important;
        }
      }
    `;
  }

  // Validate font settings
  validateFontSettings(settings: FontSettings): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];

    if (!this.getFontOption(settings.headingFont)) {
      errors.push(`Başlıq şrifti tapılmadı: ${settings.headingFont}`);
    }

    if (!this.getFontOption(settings.bodyFont)) {
      errors.push(`Mətn şrifti tapılmadı: ${settings.bodyFont}`);
    }

    if (settings.fontSize < 8 || settings.fontSize > 18) {
      errors.push('Şrift ölçüsü 8-18pt aralığında olmalıdır');
    }

    if (settings.lineHeight < 0.8 || settings.lineHeight > 2.5) {
      errors.push('Sətir hündürlüyü 0.8-2.5 aralığında olmalıdır');
    }

    if (settings.letterSpacing < -2 || settings.letterSpacing > 5) {
      errors.push('Hərf aralığı -2px və 5px arasında olmalıdır');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get font loading status
  getFontLoadingStatus(): {
    loaded: string[];
    loading: string[];
    failed: string[];
    total: number;
  } {
    const allGoogleFonts = FONT_OPTIONS
      .filter(font => font.googleFont)
      .map(font => font.googleFont!);

    return {
      loaded: Array.from(this.loadedFonts),
      loading: Array.from(this.fontLoadPromises.keys()),
      failed: allGoogleFonts.filter(font =>
        this.retryAttempts.has(font) &&
        this.retryAttempts.get(font)! >= this.maxRetries
      ),
      total: allGoogleFonts.length
    };
  }

  // Clear font cache
  clearFontCache(): void {
    this.loadedFonts.clear();
    this.fontLoadPromises.clear();
    this.retryAttempts.clear();

    // Remove existing font link elements
    const existingLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    existingLinks.forEach(link => link.remove());
  }

  // Export current settings
  exportSettings(settings: FontSettings): string {
    return JSON.stringify({
      ...settings,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }, null, 2);
  }

  // Import settings
  importSettings(settingsJson: string): FontSettings {
    try {
      const imported = JSON.parse(settingsJson);

      // Validate imported settings
      const validation = this.validateFontSettings(imported);
      if (!validation.isValid) {
        throw new Error(`Gələn tənzimlər səhvdir: ${validation.errors.join(', ')}`);
      }

      return {
        headingFont: imported.headingFont || DEFAULT_FONT_SETTINGS.headingFont,
        bodyFont: imported.bodyFont || DEFAULT_FONT_SETTINGS.bodyFont,
        fontSize: imported.fontSize || DEFAULT_FONT_SETTINGS.fontSize,
        lineHeight: imported.lineHeight || DEFAULT_FONT_SETTINGS.lineHeight,
        letterSpacing: imported.letterSpacing || DEFAULT_FONT_SETTINGS.letterSpacing,
        fontWeight: imported.fontWeight || DEFAULT_FONT_SETTINGS.fontWeight,
        fontSizes: imported.fontSizes || DEFAULT_FONT_SETTINGS.fontSizes
      };
    } catch (error) {
      throw new Error(`Tənzimləri import etmək mümkün olmadı: ${error}`);
    }
  }

  // Get font performance metrics
  getPerformanceMetrics(): {
    loadTimes: Map<string, number>;
    failureRate: number;
    averageLoadTime: number;
  } {
    const loadTimes = new Map<string, number>();
    const totalAttempts = this.loadedFonts.size +
      Array.from(this.retryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);

    const failures = Array.from(this.retryAttempts.values())
      .filter(attempts => attempts >= this.maxRetries).length;

    return {
      loadTimes,
      failureRate: totalAttempts > 0 ? failures / totalAttempts : 0,
      averageLoadTime: 0 // Would need to implement timing measurement
    };
  }
}

export default FontManager;
