import { useEffect } from 'react';

interface SchemaData {
  [key: string]: any;
}

export function useSchema(schema: SchemaData, id: string) {
  useEffect(() => {
    const existingScript = document.getElementById(id);
    if (existingScript) existingScript.remove();

    if (!schema || Object.keys(schema).length === 0) return;

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [schema, id]);
}

export const homePageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/#webpage",
      "url": "https://www.pexly.app/",
      "name": "Pexly — Your wallet, your way to pay",
      "description": "Spend crypto directly from your own wallet. Buy gift cards, top up mobile phones, pay utility bills, and shop global products on Pexly.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "about": {
        "@id": "https://www.pexly.app/#organization"
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://www.pexly.app/hero-bg.webp"
      },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        }
      ]
    }
  ]
};

export const giftCardsPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.pexly.app/gift-cards#webpage",
      "url": "https://www.pexly.app/gift-cards",
      "name": "Crypto Gift Cards — Instant Digital Delivery | Pexly",
      "description": "Buy digital gift cards for shopping, gaming, dining, and streaming using cryptocurrency. Instant digital delivery straight from your wallet.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Gift Cards", "item": "https://www.pexly.app/gift-cards" }
      ]
    }
  ]
};

export const giftCardsAllPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.pexly.app/gift-cards/all#webpage",
      "url": "https://www.pexly.app/gift-cards/all",
      "name": "All Gift Cards — Browse Global Brands | Pexly",
      "description": "Explore hundreds of global gift card brands by country and category. Pay seamlessly with Bitcoin, USDT, USDC, and major cryptocurrencies.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Gift Cards", "item": "https://www.pexly.app/gift-cards" },
        { "@type": "ListItem", "position": 3, "name": "All Gift Cards", "item": "https://www.pexly.app/gift-cards/all" }
      ]
    }
  ]
};

export const mobileTopupPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/mobile-topup#webpage",
      "url": "https://www.pexly.app/mobile-topup",
      "name": "Mobile Top-Up with Crypto — Global Airtime & Data | Pexly",
      "description": "Recharge prepaid mobile phones and data plans worldwide with cryptocurrency. Instant airtime top-ups across global carriers on Pexly.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Mobile Top-Up", "item": "https://www.pexly.app/mobile-topup" }
      ]
    }
  ]
};

export const utilityPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/utility#webpage",
      "url": "https://www.pexly.app/utility",
      "name": "Pay Utility Bills with Crypto — Electricity, Water & TV | Pexly",
      "description": "Pay electricity, water, internet, and TV utility bills directly using cryptocurrency from your self-custody wallet on Pexly.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Utility Bills", "item": "https://www.pexly.app/utility" }
      ]
    }
  ]
};

export const aboutPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://www.pexly.app/about-us#webpage",
      "url": "https://www.pexly.app/about-us",
      "name": "About Us — Non-Custodial Crypto Commerce | Pexly",
      "description": "Learn how Pexly enables non-custodial crypto payments for gift cards, mobile top-ups, utility bills, and global products without holding user funds.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "mainEntity": {
        "@id": "https://www.pexly.app/#organization"
      },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "About Us", "item": "https://www.pexly.app/about-us" }
      ]
    }
  ]
};

export const teamsPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/teams#webpage",
      "url": "https://www.pexly.app/teams",
      "name": "Our Team — People Building Pexly | Pexly",
      "description": "Meet the engineers, designers, and operators building Pexly's non-custodial marketplace for digital services and everyday crypto commerce.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Teams", "item": "https://www.pexly.app/teams" }
      ]
    }
  ]
};

export const careerPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/career#webpage",
      "url": "https://www.pexly.app/career",
      "name": "Careers at Pexly — Join Our Remote Team | Pexly",
      "description": "Explore open roles at Pexly and help build non-custodial crypto commerce tools for gift cards, global shopping, and digital payments.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Careers", "item": "https://www.pexly.app/career" }
      ]
    }
  ]
};

export const blogPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Blog",
      "@id": "https://www.pexly.app/blogs#webpage",
      "url": "https://www.pexly.app/blogs",
      "name": "Pexly Blog — Crypto Commerce, Wallets & Guides",
      "description": "Read product updates, self-custody guides, and insights on spending cryptocurrency for gift cards, utility bills, and everyday shopping.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "publisher": {
        "@id": "https://www.pexly.app/#organization"
      },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.pexly.app/blogs" }
      ]
    }
  ]
};

export const supportPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": "https://www.pexly.app/support#webpage",
      "url": "https://www.pexly.app/support",
      "name": "Help Center — Guides & Customer Support | Pexly",
      "description": "Browse Pexly Help Center guides for gift cards, mobile top-ups, utility bill payments, physical orders, and self-custody wallet connections.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "mainEntity": {
        "@type": "ContactPoint",
        "contactType": "technical support",
        "email": "support@pexly.app",
        "availableLanguage": ["English"],
        "hoursAvailable": "Mo-Su 00:00-24:00"
      },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Pexly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pexly is a non-custodial crypto marketplace where you can pay directly from your own wallet for digital gift cards, mobile top-ups, utility bills, and physical products."
          }
        },
        {
          "@type": "Question",
          "name": "Does Pexly hold my crypto or funds?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Pexly is non-custodial. You keep full control of your wallet and private keys at all times and authorize each payment directly."
          }
        },
        {
          "@type": "Question",
          "name": "How do payments work on Pexly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Choose a gift card, mobile top-up, utility biller, or physical product, pick your preferred cryptocurrency at checkout, and pay directly from your connected or external wallet."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Support", "item": "https://www.pexly.app/support" }
      ]
    }
  ]
};

export const shopPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.pexly.app/shop#webpage",
      "url": "https://www.pexly.app/shop",
      "name": "Crypto Shop — Buy Physical Products with Crypto | Pexly",
      "description": "Shop electronics, fashion, home essentials, and global products online. Pay directly with Bitcoin, Ethereum, USDT, USDC, and more on Pexly.",
      "isPartOf": { "@id": "https://www.pexly.app/#website" },
      "dateModified": "2026-11-22T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
        { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://www.pexly.app/shop" }
      ]
    }
  ]
};

export function createProductSchema(product: {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  availableForSale?: boolean;
}, urlId: string) {
  const productUrl = `https://www.pexly.app/shop/product/${encodeURIComponent(urlId)}`;
  const cleanDescription = product.description
    ? product.description.replace(/<[^>]+>/g, '').trim().slice(0, 5000)
    : '';
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "name": product.title,
        "description": cleanDescription,
        "url": productUrl,
        "image": product.images.slice(0, 5).filter(Boolean),
        "offers": {
          "@type": "Offer",
          "price": product.price.toFixed(2),
          "priceCurrency": product.currency,
          "availability": product.availableForSale !== false
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          "url": productUrl,
          "seller": {
            "@type": "Organization",
            "name": "Pexly",
            "url": "https://www.pexly.app"
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.pexly.app/" },
          { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://www.pexly.app/shop" },
          { "@type": "ListItem", "position": 3, "name": product.title, "item": productUrl }
        ]
      }
    ]
  };
}
