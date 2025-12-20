import { useEffect } from 'react';

interface BitrefillWidgetProps {
  url?: string;
  theme?: 'light' | 'dark';
  refCode?: string;
  paymentMethods?: string[];
}

export const BitrefillWidget = ({
  url = 'https://embed.bitrefill.com/',
  theme = 'light',
  refCode = 'wfrjndqy',
  paymentMethods = [
    'ethereum',
    'lightning',
    'litecoin',
    'solana',
    'usdc_erc20',
    'usdc_solana',
    'usdt_bsc',
    'usdt_erc20',
    'usdt_trc20'
  ]
}: BitrefillWidgetProps) => {
  const config = {
    theme,
    ref: refCode,
    paymentMethods: paymentMethods.join(','),
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://embed.bitrefill.com') {
        return;
      }

      const { event, invoiceId, paymentUri } = e.data;

      switch (event) {
        case 'payment_intent':
          // Handle payment intent - use paymentUri for payment
          console.log('Payment intent received:', { invoiceId, paymentUri });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      title="Bitrefill"
      src={`${url}?${new URLSearchParams(config as Record<string, string>)}`}
      style={{
        border: 'none',
        width: '100%',
        height: '600px',
        borderRadius: '8px'
      }}
      sandbox="allow-same-origin allow-popups allow-scripts allow-forms"
      allowFullScreen
    />
  );
};
