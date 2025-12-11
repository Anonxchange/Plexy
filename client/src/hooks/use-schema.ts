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
      "name": "Pexly - Buy & Sell Bitcoin, Ethereum & Crypto P2P",
      "description": "Trade cryptocurrency peer-to-peer with 500+ payment methods. Buy and sell Bitcoin, Ethereum, USDT instantly with escrow protection.",
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
      "@type": "FinancialService",
      "name": "Pexly P2P Cryptocurrency Exchange",
      "description": "Peer-to-peer cryptocurrency marketplace supporting Bitcoin, Ethereum, USDT and more with 500+ payment methods across 140+ countries.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "serviceType": "Cryptocurrency Exchange",
      "areaServed": "Worldwide",
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": "https://www.pexly.app/p2p"
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
      "name": "About Pexly - Our Story & Mission",
      "description": "Learn about Pexly, the leading P2P cryptocurrency trading platform serving 100K+ users worldwide with 500+ payment methods.",
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
      "name": "P2P Crypto Trading - Buy & Sell Bitcoin, Ethereum with 500+ Payment Methods",
      "description": "Trade crypto peer-to-peer with verified traders. 500+ payment methods, escrow protection, and instant trades across 140+ countries.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "FinancialService",
      "@id": "https://www.pexly.app/p2p#service",
      "name": "P2P Cryptocurrency Trading",
      "description": "Buy and sell cryptocurrency directly with other users using your preferred payment method. Secure escrow protection on every trade.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "serviceType": "Peer-to-Peer Cryptocurrency Exchange",
      "areaServed": "Worldwide",
      "offers": {
        "@type": "Offer",
        "description": "Trade Bitcoin, Ethereum, USDT with 500+ payment methods",
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
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "P2P Trading",
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
      "name": "Spot Trading - Trade Bitcoin, Ethereum & Crypto | Pexly",
      "description": "Trade cryptocurrency on our spot exchange. Real-time prices, advanced charts, and professional trading tools for BTC, ETH, and more.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "FinancialService",
      "@id": "https://www.pexly.app/spot#service",
      "name": "Spot Cryptocurrency Trading",
      "description": "Professional spot trading platform with real-time charts, order books, and advanced trading tools.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "serviceType": "Cryptocurrency Spot Exchange"
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
          "name": "Spot Trading",
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
      "name": "Swap Crypto - Instant Cryptocurrency Exchange | Pexly",
      "description": "Instantly swap between cryptocurrencies with competitive rates. Exchange BTC, ETH, USDT and more with low fees.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "FinancialService",
      "@id": "https://www.pexly.app/swap#service",
      "name": "Cryptocurrency Swap Service",
      "description": "Instantly exchange one cryptocurrency for another at competitive market rates.",
      "provider": {
        "@id": "https://www.pexly.app/#organization"
      },
      "serviceType": "Cryptocurrency Exchange Service"
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
          "name": "Swap",
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
      "name": "Crypto Markets - Live Prices & Charts | Pexly",
      "description": "Track live cryptocurrency prices, market caps, and trading volumes. Real-time data for Bitcoin, Ethereum, and hundreds of altcoins.",
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
          "name": "Markets",
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
      "name": "Buy Crypto - Purchase Bitcoin, Ethereum & More | Pexly",
      "description": "Buy cryptocurrency instantly with your preferred payment method. Secure, fast, and easy crypto purchases with escrow protection.",
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
      "name": "Pexly Academy - Learn Cryptocurrency Trading",
      "description": "Free educational resources about cryptocurrency trading, blockchain technology, and digital assets. Learn from beginner to advanced.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "dateModified": "2025-01-01T00:00:00Z"
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://www.pexly.app/pexly-academy#organization",
      "name": "Pexly Academy",
      "description": "Free cryptocurrency education platform offering courses on trading, blockchain, and digital assets.",
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
      "description": "Stay updated with the latest cryptocurrency news, market analysis, and trading insights from Pexly experts.",
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
      "description": "Get help with your Pexly account, trades, or any issues. Our support team is available 24/7.",
      "isPartOf": {
        "@id": "https://www.pexly.app/#website"
      },
      "mainEntity": {
        "@type": "ContactPoint",
        "contactType": "customer support",
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
          "name": "How do I buy cryptocurrency on Pexly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To buy cryptocurrency on Pexly, create an account, browse available offers on the P2P marketplace, select your preferred payment method, and complete the trade with escrow protection."
          }
        },
        {
          "@type": "Question",
          "name": "Is Pexly safe to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Pexly uses escrow protection on all trades. Funds are held securely until both parties confirm the transaction is complete."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods does Pexly support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pexly supports 500+ payment methods including bank transfer, PayPal, credit cards, mobile payments, and more across 140+ countries."
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

export const feesPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.pexly.app/fees#webpage",
      "url": "https://www.pexly.app/fees",
      "name": "Trading Fees - Transparent Pricing | Pexly",
      "description": "View our transparent fee structure for P2P trading, withdrawals, and other services. Low fees for all traders.",
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
          "name": "Fees",
          "item": "https://www.pexly.app/fees"
        }
      ]
    }
  ]
};
