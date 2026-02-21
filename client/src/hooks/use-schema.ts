import { useEffect } from 'react';

interface SchemaData {
  [key: string]: any;
}

export function useSchema(schema: SchemaData, id: string) {
  useEffect(() => {
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
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
      "name": "Pexly - Non-Custodial P2P Crypto Software",
      "description": "Pexly provides non-custodial software that connects crypto buyers and sellers peer-to-peer. Users maintain full control of their funds at all times.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "about": {
        "@id": "https://www.pexly.app/#organization"
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://www.pexly.app/favicon.svg"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "SoftwareApplication",
      "name": "Pexly P2P Software Platform",
      "description": "Non-custodial software platform that facilitates peer-to-peer cryptocurrency transactions. Pexly does not hold, control, or manage user funds. All trades occur directly between users.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "availableOnDevice": "Desktop, Mobile",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
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

export const aboutPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://www.pexly.app/about#webpage",
      "url": "https://www.pexly.app/about",
      "name": "About Pexly - Non-Custodial Software Provider",
      "description": "Learn about Pexly, a non-custodial software provider offering tools for peer-to-peer cryptocurrency transactions. We never hold or control user assets.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "mainEntity": {
        "@id": "https://www.pexly.app/#organization"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "About",
          "item": "https://www.pexly.app/about"
        }
      ]
    }
  ]
};

export const p2pPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/p2p#webpage",
      "url": "https://www.pexly.app/p2p",
      "name": "P2P Software - Connect Buyers & Sellers Directly | Pexly",
      "description": "Non-custodial software connecting crypto buyers and sellers directly. Users trade peer-to-peer and retain full custody of their assets throughout.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.pexly.app/p2p#software",
      "name": "Pexly P2P Matching Software",
      "description": "Non-custodial peer-to-peer matching software. Pexly provides the interface for users to discover and connect with each other. Pexly does not execute trades, hold funds, or act as a counterparty.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "P2P Software",
          "item": "https://www.pexly.app/p2p"
        }
      ]
    }
  ]
};

export const spotPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/spot#webpage",
      "url": "https://www.pexly.app/spot",
      "name": "Spot Interface - Market Data & Charting Tools | Pexly",
      "description": "Access real-time market data, charting tools, and order book visualization. Pexly is a non-custodial software provider and does not hold user funds.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.pexly.app/spot#software",
      "name": "Pexly Market Interface Software",
      "description": "Non-custodial charting and market data interface. Provides visualization tools for cryptocurrency markets. Pexly does not custody, transmit, or control any digital assets.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Spot Interface",
          "item": "https://www.pexly.app/spot"
        }
      ]
    }
  ]
};

export const swapPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/swap#webpage",
      "url": "https://www.pexly.app/swap",
      "name": "Swap Interface - Non-Custodial Token Swap Software | Pexly",
      "description": "Non-custodial swap interface powered by third-party decentralized protocols. Pexly provides the software interface only and never takes custody of user assets.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.pexly.app/swap#software",
      "name": "Pexly Swap Interface Software",
      "description": "Non-custodial front-end interface for decentralized token swaps. Pexly does not process, execute, or intermediate any transactions. Users interact directly with underlying protocols.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Swap Interface",
          "item": "https://www.pexly.app/swap"
        }
      ]
    }
  ]
};

export const marketsPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/markets#webpage",
      "url": "https://www.pexly.app/markets",
      "name": "Market Data - Live Crypto Prices & Charts | Pexly",
      "description": "View live cryptocurrency market data, prices, and charts. Pexly provides informational software tools only and is a non-custodial software provider.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Market Data",
          "item": "https://www.pexly.app/markets"
        }
      ]
    }
  ]
};

export const buyPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/buy#webpage",
      "url": "https://www.pexly.app/buy",
      "name": "Buy Crypto - Connect with Sellers via Pexly Software",
      "description": "Use Pexly's non-custodial software to connect with sellers. Pexly provides the matching interface only — all transactions occur directly between users without Pexly holding any funds.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Buy Crypto",
          "item": "https://www.pexly.app/buy"
        }
      ]
    }
  ]
};

export const academyPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/pexly-academy#webpage",
      "url": "https://www.pexly.app/pexly-academy",
      "name": "Pexly Academy - Learn About Cryptocurrency",
      "description": "Free educational resources about cryptocurrency and blockchain technology. Provided by Pexly, a non-custodial software provider.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://www.pexly.app/pexly-academy#organization",
      "name": "Pexly Academy",
      "description": "Free educational platform offering informational content on cryptocurrency and blockchain. Operated by Pexly, a non-custodial software provider.",
      "parentOrganization": {
        "@id": "https://www.pexly.app/#organization"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Academy",
          "item": "https://www.pexly.app/pexly-academy"
        }
      ]
    }
  ]
};

export const blogPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Blog",
      "@id": "https://www.pexly.app/blog#webpage",
      "url": "https://www.pexly.app/blog",
      "name": "Pexly Blog - Crypto News & Insights",
      "description": "Stay updated with cryptocurrency news and insights from Pexly, a non-custodial software provider.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "publisher": {
        "@id": "https://www.pexly.app/#organization"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://www.pexly.app/blog"
        }
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
      "name": "Support - Get Help | Pexly",
      "description": "Get help with using Pexly software. Our support team assists with platform usage — Pexly is a non-custodial software provider and does not manage user funds.",
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
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Pexly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pexly is a non-custodial software provider that offers tools for peer-to-peer cryptocurrency transactions. Pexly does not hold, control, or transmit any user funds."
          }
        },
        {
          "@type": "Question",
          "name": "Does Pexly hold my crypto or funds?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Pexly is strictly a non-custodial software provider. Users retain full custody and control of their assets at all times. Pexly provides the software interface only."
          }
        },
        {
          "@type": "Question",
          "name": "How does P2P work on Pexly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pexly's software connects buyers and sellers directly. Users negotiate and transact peer-to-peer. Pexly provides the matching interface but does not act as a counterparty or intermediary in any transaction."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.pexly.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Support",
          "item": "https://www.pexly.app/support"
        }
      ]
    }
  ]
};
