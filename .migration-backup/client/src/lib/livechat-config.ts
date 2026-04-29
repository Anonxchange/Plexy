/**
 * Live Chat Integration Configuration
 * 
 * This file contains setup instructions and integration code for popular live chat services.
 * Choose one of the following options based on your needs:
 * 
 * 1. Tawk.to - 100% FREE (Recommended for startups)
 * 2. Crisp - Free plan available, $25/month for Pro
 * 3. Intercom - Premium option, starts at $39/seat/month
 */

export type LiveChatProvider = 'tawkto' | 'crisp' | 'intercom';

export interface LiveChatConfig {
  provider: LiveChatProvider;
  tawkto?: {
    propertyId: string;  // Your Tawk.to property ID
    widgetId: string;    // Your Tawk.to widget ID
  };
  crisp?: {
    websiteId: string;   // Your Crisp website ID
  };
  intercom?: {
    appId: string;       // Your Intercom app ID
  };
}

/**
 * Initialize live chat widget
 * Call this function in your index.html or main App component
 */
export function initializeLiveChat(config: LiveChatConfig) {
  switch (config.provider) {
    case 'tawkto':
      if (config.tawkto) {
        loadTawkTo(config.tawkto.propertyId, config.tawkto.widgetId);
      }
      break;
    case 'crisp':
      if (config.crisp) {
        loadCrisp(config.crisp.websiteId);
      }
      break;
    case 'intercom':
      if (config.intercom) {
        loadIntercom(config.intercom.appId);
      }
      break;
  }
}

// Tawk.to integration
function loadTawkTo(propertyId: string, widgetId: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  }
  
  // Initialize Tawk_API
  (window as any).Tawk_API = (window as any).Tawk_API || {};
  (window as any).Tawk_LoadStart = new Date();
}

// Crisp integration
function loadCrisp(websiteId: string) {
  (window as any).$crisp = [];
  (window as any).CRISP_WEBSITE_ID = websiteId;
  
  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  
  const head = document.getElementsByTagName('head')[0];
  if (head) {
    head.appendChild(script);
  }
}

// Intercom integration
function loadIntercom(appId: string) {
  (window as any).intercomSettings = {
    api_base: "https://api-iam.intercom.io",
    app_id: appId
  };
  
  const w: any = window;
  const ic = w.Intercom;
  
  if (typeof ic === "function") {
    ic('reattach_activator');
    ic('update', w.intercomSettings);
  } else {
    const d = document;
    const i: any = function() {
      i.c(arguments);
    };
    i.q = [];
    i.c = function(args: any) {
      i.q.push(args);
    };
    w.Intercom = i;
    
    const l = function() {
      const s = d.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = `https://widget.intercom.io/widget/${appId}`;
      const x = d.getElementsByTagName('script')[0];
      if (x && x.parentNode) {
        x.parentNode.insertBefore(s, x);
      }
    };
    
    if (document.readyState === 'complete') {
      l();
    } else {
      w.addEventListener('load', l, false);
    }
  }
}

export {};
