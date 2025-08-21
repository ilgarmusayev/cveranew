// Structured Data utility for SEO optimization
export interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Service' | 'Product' | 'BreadcrumbList' | 'FAQPage' | 'Article';
  data: any;
}

export function generateStructuredData({ type, data }: StructuredDataProps): string {
  const baseContext = "https://schema.org";

  const structuredData = {
    "@context": baseContext,
    "@type": type,
    ...data
  };

  return JSON.stringify(structuredData, null, 2);
}

// Organization structured data for CVERA
export const organizationData = {
  name: "CVERA",
  description: "AI əsaslı peşəkar CV yaratma platforması - Süni intellektlə sürətli və fərdi CV hazırlayaraq karyeranızı zirvəyə daşıyın",
  url: "https://cvera.net",
  logo: "https://cvera.net/cveralogo.svg",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@cvera.net"
  },
  sameAs: [
    "https://linkedin.com/company/cvera",
    "https://instagram.com/cvera.net"
  ],
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Musayev"
  },
  areaServed: {
    "@type": "Country",
    name: "Azerbaijan"
  },
  serviceType: [
    "CV Creation",
    "Resume Building",
    "LinkedIn Import",
    "AI-Powered CV Enhancement"
  ]
};

// Website structured data
export const websiteData = {
  url: "https://cvera.net",
  name: "CVERA - AI Əsaslı CV Yaratma Platforması",
  description: "Peşəkar CV-nizi AI texnologiyası ilə yaradın. LinkedIn import, müxtəlif şablonlar və AI təkmilləşdirmə xidmətləri.",
  inLanguage: "az",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cvera.net/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  publisher: {
    "@type": "Organization",
    name: "CVERA",
    logo: {
      "@type": "ImageObject",
      url: "https://cvera.net/cveralogo.svg"
    }
  }
};

// Service structured data for CV creation
export const serviceData = {
  name: "AI Əsaslı CV Yaratma Xidməti",
  description: "Süni intellekt texnologiyası ilə peşəkar CV yaratma, LinkedIn profili import etmə və müxtəlif şablonlarla CV dizaynı",
  provider: {
    "@type": "Organization",
    name: "CVERA",
    url: "https://cvera.net"
  },
  serviceType: "Professional Resume Writing Service",
  areaServed: {
    "@type": "Country",
    name: "Azerbaijan"
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "CV Yaratma Planları",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Pulsuz Plan"
        },
        price: "0",
        priceCurrency: "AZN",
        availability: "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Orta Plan"
        },
        price: "2.99",
        priceCurrency: "AZN",
        availability: "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Premium Plan"
        },
        price: "4.99",
        priceCurrency: "AZN",
        availability: "https://schema.org/InStock"
      }
    ]
  },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "4.99",
    priceCurrency: "AZN",
    availability: "https://schema.org/InStock"
  }
};

// Product structured data for CV templates
export const templateProductData = {
  name: "CV Şablonları Kolleksiyası",
  description: "Peşəkar CV şablonları - Modern, Classic, Creative və daha çox dizayn seçimləri",
  brand: {
    "@type": "Brand",
    name: "CVERA"
  },
  category: "Resume Templates",
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
    price: "0",
    priceCurrency: "AZN",
    seller: {
      "@type": "Organization",
      name: "CVERA"
    }
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "250",
    bestRating: "5",
    worstRating: "1"
  }
};

// FAQ structured data
export const faqData = {
  mainEntity: [
    {
      "@type": "Question",
      name: "CVERA nədir və necə işləyir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CVERA AI əsaslı CV yaratma platformasıdır. LinkedIn profilinizi import edərək və ya məlumatları manual daxil edərək peşəkar CV yarada bilərsiniz. AI texnologiyası ilə CV-nizi təkmilləşdirə və müxtəlif şablonlarla dizayn edə bilərsiniz."
      }
    },
    {
      "@type": "Question",
      name: "LinkedIn profilimi necə import edə bilərəm?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LinkedIn import funksiyası ilə profilinizin URL-ini daxil edərək bütün məlumatlarınızı avtomatik olaraq CV-yə çevirə bilərsiniz. Bu funksiya bütün planlarda mövcuddur."
      }
    },
    {
      "@type": "Question",
      name: "Hansı fayl formatlarında CV yükləyə bilərəm?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pulsuz planda PDF, Orta və Premium planlarda həm PDF həm də DOCX formatında CV yükləyə bilərsiniz."
      }
    },
    {
      "@type": "Question",
      name: "AI CV təkmilləşdirmə necə işləyir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI sistem CV məzmununuzu analiz edərək daha peşəkar və effektiv bir dil təklif edir, iş təcrübələrinizi optimallaşdırır və açar sözləri təkmilləşdirir."
      }
    }
  ]
};

// Breadcrumb structured data generator
export function generateBreadcrumbData(items: Array<{ name: string; url: string }>) {
  return {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// Article structured data for blog posts
export function generateArticleData(article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}) {
  return {
    headline: article.headline,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author
    },
    publisher: {
      "@type": "Organization",
      name: "CVERA",
      logo: {
        "@type": "ImageObject",
        url: "https://cvera.net/cveralogo.svg"
      }
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url
    },
    image: article.image ? {
      "@type": "ImageObject",
      url: article.image
    } : undefined
  };
}
