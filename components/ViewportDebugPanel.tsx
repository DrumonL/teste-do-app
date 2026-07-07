"use client";

import { useEffect, useState } from "react";

type ViewportInfo = {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  devicePixelRatio: number;
  userAgent: string;
};

function getViewportInfo(): ViewportInfo {
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
  };
}

export default function ViewportDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [info, setInfo] = useState<ViewportInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldShow = params.get("debug") === "1";

    setEnabled(shouldShow);

    if (!shouldShow) {
      return;
    }

    const updateInfo = () => setInfo(getViewportInfo());

    updateInfo();
    window.addEventListener("resize", updateInfo);
    window.addEventListener("orientationchange", updateInfo);

    const intervalId = window.setInterval(updateInfo, 500);

    return () => {
      window.removeEventListener("resize", updateInfo);
      window.removeEventListener("orientationchange", updateInfo);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!enabled || !info) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        zIndex: 2147483647,
        maxWidth: "min(420px, calc(100vw - 16px))",
        padding: "10px 12px",
        background: "#ffffff",
        color: "#000000",
        border: "1px solid #000000",
        borderRadius: 4,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 12,
        lineHeight: 1.35,
        pointerEvents: "none",
        whiteSpace: "normal",
        wordBreak: "break-word",
      }}
    >
      <div>
        <strong>window.innerWidth:</strong> {info.innerWidth}
      </div>
      <div>
        <strong>window.innerHeight:</strong> {info.innerHeight}
      </div>
      <div>
        <strong>window.outerWidth:</strong> {info.outerWidth}
      </div>
      <div>
        <strong>window.outerHeight:</strong> {info.outerHeight}
      </div>
      <div>
        <strong>window.devicePixelRatio:</strong> {info.devicePixelRatio}
      </div>
      <div>
        <strong>navigator.userAgent:</strong> {info.userAgent}
      </div>
    </div>
  );
}
