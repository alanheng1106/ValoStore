"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";

export default function LoginForm() {
  const [mode, setMode] = useState("qr"); // "qr" or "password"
  
  // Password login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [emailHint, setEmailHint] = useState("");
  const [mfaCookies, setMfaCookies] = useState(null);

  // QR login state
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrSessionId, setQrSessionId] = useState(null);
  const [qrStatus, setQrStatus] = useState("loading"); // loading, ready, polling, success, expired, error
  const pollIntervalRef = useRef(null);

  const router = useRouter();
  const { t } = useI18n();

  // ─── QR Code Login ─────────────────────────────────────

  const initQr = useCallback(async () => {
    setQrStatus("loading");
    setError("");
    setQrDataUrl(null);

    try {
      const res = await fetch("/api/auth/qr/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "en-US" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to init QR");

      setQrSessionId(data.sessionId);

      // Generate QR code as data URL on the client
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(data.loginUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#FFFFFF", light: "#00000000" },
      });
      setQrDataUrl(dataUrl);
      setQrStatus("ready");
    } catch (err) {
      setError(err.message);
      setQrStatus("error");
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!qrSessionId || pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/qr/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: qrSessionId }),
        });
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setQrStatus("success");
          setTimeout(() => router.push("/dashboard"), 500);
        } else if (data.status === "expired") {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setQrStatus("expired");
        }
        // "pending" → keep polling
      } catch {
        // Network error, keep trying
      }
    }, 2000);
  }, [qrSessionId, router]);

  // Start polling when QR is ready
  useEffect(() => {
    if (qrStatus === "ready" && qrSessionId) {
      startPolling();
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [qrStatus, qrSessionId, startPolling]);

  // Init QR on mount when in QR mode
  useEffect(() => {
    if (mode === "qr") {
      initQr();
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [mode, initQr]);

  // ─── Password Login ────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || t("common.error"));

      if (data.requires_mfa) {
        setRequiresMfa(true);
        setEmailHint(data.email_hint);
        setMfaCookies(data.cookies);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode, cookies: mfaCookies }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("common.error"));

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Tab Switcher ──────────────────────────────────────

  const switchMode = (newMode) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setError("");
    setRequiresMfa(false);
    setMode(newMode);
  };

  // ─── Render ────────────────────────────────────────────

  // MFA view (shared)
  if (requiresMfa) {
    return (
      <form onSubmit={handleMfa} className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-center mb-2">{t("auth.mfa_title")}</h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            {t("auth.mfa_desc")} <br/>
            <span className="text-white">{emailHint}</span>
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{t("auth.mfa_code")}</label>
          <input
            type="text"
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F1923] border border-white/10 rounded-lg focus:outline-none focus:border-[#FF4655] focus:ring-1 focus:ring-[#FF4655] transition-colors"
            placeholder="123456"
          />
        </div>

        {error && <div className="text-[#FF4655] text-sm text-center bg-[#FF4655]/10 p-2 rounded">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#FF4655] hover:bg-[#FF4655]/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("auth.logging_in") : t("auth.mfa_verify_btn")}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex rounded-lg bg-[#0F1923] p-1 border border-white/5">
        <button
          type="button"
          onClick={() => switchMode("qr")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "qr"
              ? "bg-[#FF4655] text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("auth.qr_tab")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "password"
              ? "bg-[#FF4655] text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("auth.password_tab")}
        </button>
      </div>

      {/* QR Code Mode */}
      {mode === "qr" && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-gray-400 text-center">{t("auth.qr_desc")}</p>
          
          <div className="relative w-[280px] h-[280px] flex items-center justify-center bg-[#0F1923] rounded-xl border border-white/10">
            {qrStatus === "loading" && (
              <div className="w-10 h-10 border-4 border-[#FF4655]/30 border-t-[#FF4655] rounded-full animate-spin"></div>
            )}
            {(qrStatus === "ready" || qrStatus === "polling") && qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full rounded-xl" />
            )}
            {qrStatus === "success" && (
              <div className="text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-[#00D4AA] font-bold">{t("auth.qr_success")}</p>
              </div>
            )}
            {qrStatus === "expired" && (
              <div className="text-center p-4">
                <p className="text-gray-400 mb-3">{t("auth.qr_expired")}</p>
                <button
                  onClick={initQr}
                  className="px-4 py-2 bg-[#FF4655] hover:bg-[#FF4655]/80 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {t("auth.qr_refresh")}
                </button>
              </div>
            )}
            {qrStatus === "error" && (
              <div className="text-center p-4">
                <p className="text-[#FF4655] text-sm mb-3">{error}</p>
                <button
                  onClick={initQr}
                  className="px-4 py-2 bg-[#FF4655] hover:bg-[#FF4655]/80 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {t("auth.qr_refresh")}
                </button>
              </div>
            )}

          </div>

          {/* Scanning animation status (Moved outside QR to avoid blocking) */}
          {(qrStatus === "ready" || qrStatus === "polling") && (
            <div className="flex items-center gap-2 bg-[#1A2332] border border-white/5 px-4 py-2 rounded-full shadow-lg">
              <span className="w-2.5 h-2.5 bg-[#00D4AA] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-300">{t("auth.qr_waiting")}</span>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center max-w-xs">
            {t("auth.qr_instructions")}
          </p>
        </div>
      )}

      {/* Password Mode */}
      {mode === "password" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t("auth.username")}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1923] border border-white/10 rounded-lg focus:outline-none focus:border-[#FF4655] focus:ring-1 focus:ring-[#FF4655] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t("auth.password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1923] border border-white/10 rounded-lg focus:outline-none focus:border-[#FF4655] focus:ring-1 focus:ring-[#FF4655] transition-colors"
            />
          </div>

          {error && <div className="text-[#FF4655] text-sm text-center bg-[#FF4655]/10 p-2 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#FF4655] hover:bg-[#FF4655]/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? t("auth.logging_in") : t("auth.login_btn")}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            {t("auth.security_notice")}
          </p>
        </form>
      )}
    </div>
  );
}
