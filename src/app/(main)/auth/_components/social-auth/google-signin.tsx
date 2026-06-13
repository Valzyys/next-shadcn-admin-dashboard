"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number | string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              type?: string;
            }
          ) => void;
        };
      };
    };
  }
}

async function saveSession(
  access_token: string,
  refresh_token: string,
  expires_in: number,
  user: object
) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token, refresh_token, expires_in, user, remember: false }),
  });
  return res.json();
}

export function GoogleSignIn({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCredential = async (credential: string) => {
    try {
      const gwRes = await fetch(`${GATEWAY_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
      });
      const gwResult = await gwRes.json();

      if (!gwResult.status) {
        alert(gwResult.message || "Google login gagal.");
        return;
      }

      const { access_token, refresh_token, expires_in, user } = gwResult.data;
      const cookieResult = await saveSession(access_token, refresh_token, expires_in, user);

      if (!cookieResult.status) {
        alert("Gagal menyimpan sesi.");
        return;
      }

      window.location.replace(cookieResult.data?.redirectUrl || "/dashboard");
    } catch {
      alert("Network error.");
    }
  };

  const initGoogle = () => {
    if (!window.google || !containerRef.current) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: (response: { credential: string }) => {
        handleCredential(response.credential);
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: containerRef.current.offsetWidth || 350,
      text: "continue_with",
      shape: "rectangular",
    });
  };

  useEffect(() => {
    if (window.google) {
      initGoogle();
    }
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />
      <div ref={containerRef} className={className} style={{ minHeight: 44 }} />
    </>
  );
}
