import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Terminal } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

type PublicConfig = {
  turnstileSiteKey: string | null;
  turnstileEnabled: boolean;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback': () => void;
          'expired-callback': () => void;
          theme?: 'dark' | 'light' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function Login({ onLogin }: LoginProps) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/public-config');
        const payload = (await response.json()) as PublicConfig;

        if (cancelled) {
          return;
        }

        setConfig(payload);
        if (!payload.turnstileEnabled) {
          onLogin();
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load Cloudflare Turnstile configuration.');
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [onLogin]);

  useEffect(() => {
    if (!config?.turnstileEnabled || !config.turnstileSiteKey || !widgetContainerRef.current || widgetIdRef.current) {
      return;
    }

    let cancelled = false;

    const renderWidget = async () => {
      try {
        await ensureTurnstileScript();

        if (cancelled || !window.turnstile || !widgetContainerRef.current || widgetIdRef.current) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
          sitekey: config.turnstileSiteKey,
          theme: 'dark',
          callback: (token) => {
            void verifyToken(token);
          },
          'error-callback': () => {
            setError('Cloudflare Turnstile failed. Refresh the page and try again.');
          },
          'expired-callback': () => {
            setError('Cloudflare Turnstile expired. Please complete the check again.');
            if (widgetIdRef.current) {
              window.turnstile?.reset(widgetIdRef.current);
            }
          },
        });
      } catch {
        setError('Unable to load Cloudflare Turnstile.');
      }
    };

    void renderWidget();

    return () => {
      cancelled = true;
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [config]);

  const verifyToken = async (token: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/turnstile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        onLogin();
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message || 'Cloudflare Turnstile validation failed.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Cloudflare Turnstile validation failed.');
      if (widgetIdRef.current) {
        window.turnstile?.reset(widgetIdRef.current);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg relative overflow-hidden crt">
      <div className="scanline"></div>

      <div className="cli-border p-8 max-w-md w-full bg-black/80 backdrop-blur-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <ShieldAlert size={48} className="text-cyber-red mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-widest text-center uppercase">
            Phish_Hunter_OSINT v2.4
          </h1>
          <p className="text-xs mt-2 opacity-70">CLOUDFLARE TURNSTILE REQUIRED</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs mb-3 uppercase tracking-wider">
              <Terminal size={12} className="inline mr-2" />
              Complete Security Check
            </label>
            <div className="min-h-[70px] flex items-center justify-center border border-cyber-red-dim bg-black/40 p-3">
              {config?.turnstileEnabled ? (
                <div ref={widgetContainerRef} />
              ) : (
                <span className="text-xs animate-pulse">LOADING SECURITY CHECK...</span>
              )}
            </div>
            {isVerifying ? (
              <p className="text-xs mt-3 animate-pulse">[*] VERIFYING CLOUDFLARE TOKEN...</p>
            ) : null}
            {error ? (
              <p className="text-xs mt-3 text-red-500">
                [!] {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 text-[10px] opacity-50 text-center space-y-1">
          <p>SYSTEM: ONLINE</p>
          <p>PROTECTION: TURNSTILE</p>
          <p>HOST: localhost:3000</p>
        </div>
      </div>
    </div>
  );
}

function ensureTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile script failed to load.')), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load.'));
    document.head.appendChild(script);
  });
}
