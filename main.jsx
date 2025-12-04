import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { ReplayComposition } from "./composition.jsx";
const rootElement = document.getElementById("player-root");
const root = createRoot(rootElement);
const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
const prefetchAvatar = async (user) => {
  if (!user || !user.avatar_url) {
    return null;
  }
  const originalUrl = user.avatar_url;
  const sources = [
    `https://api.cors.lol/?url=${encodeURIComponent(originalUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(originalUrl)}`,
    `https://api.everyorigin.workers.dev/raw?url=${encodeURIComponent(originalUrl)}`,
    originalUrl
  ];
  for (const source of sources) {
    try {
      const response = await fetch(source, { mode: "cors" });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.type.startsWith("image/")) {
          return await blobToDataURL(blob);
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch avatar from ${source}`, e);
    }
  }
  return null;
};
const RenderApp = () => {
  const [replayData, setReplayData] = useState(null);
  const [prefetchedAvatarUrl, setPrefetchedAvatarUrl] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Waiting for input...");
  useEffect(() => {
    const cleanupInjectedUI = () => {
      const root2 = document.getElementById("player-root");
      if (!root2) return;
      Array.from(document.body.children).forEach((child) => {
        if (child.tagName === "DIV" && child !== root2) {
          child.style.display = "none";
        }
      });
    };
    cleanupInjectedUI();
    const interval = setInterval(cleanupInjectedUI, 200);
    return () => clearInterval(interval);
  }, []);
  const handleData = async (data) => {
    if (!data || !data.frames || data.frames.length === 0) {
      setError("Invalid replay data");
      return;
    }
    setStatus("Loading assets...");
    if (data.config && data.config.currentUser) {
      try {
        const avatarUrl = await prefetchAvatar(data.config.currentUser);
        setPrefetchedAvatarUrl(avatarUrl);
      } catch (e) {
        console.warn("Avatar fetch failed", e);
      }
    }
    setReplayData(data);
    setStatus("Ready");
  };
  const loadFromUrl = async (url) => {
    setStatus(`Fetching data from ${url}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      await handleData(data);
    } catch (e) {
      console.error("Error loading replay JSON:", e);
      setError(`Failed to load replay: ${e.message}`);
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const renderUrl = params.get("render");
    if (renderUrl) {
      loadFromUrl(renderUrl);
    }
    const messageHandler = (event) => {
      const { data } = event;
      if (!data) return;
      console.log("RenderPage received message:", data);
      if (typeof data === "string" && (data.startsWith("http") || data.startsWith("/"))) {
        loadFromUrl(data);
      } else if (data.url) {
        loadFromUrl(data.url);
      } else if (data.type === "render" && data.url) {
        loadFromUrl(data.url);
      } else if (data.frames && data.config) {
        handleData(data);
      } else if (data.type === "render" && data.data) {
        handleData(data.data);
      }
    };
    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);
  if (error) {
    return /* @__PURE__ */ jsxDEV("div", { style: { color: "#e94560", textAlign: "center", fontFamily: "sans-serif" }, children: error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 145,
      columnNumber: 16
    });
  }
  if (!replayData) {
    return /* @__PURE__ */ jsxDEV("div", { style: { color: "#dcdcdc", textAlign: "center", fontFamily: "sans-serif" }, children: status }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 149,
      columnNumber: 16
    });
  }
  const durationInSeconds = (replayData.frames[replayData.frames.length - 1].timestamp - replayData.frames[0].timestamp) / 1e3;
  const durationInFrames = Math.ceil(durationInSeconds * 30) + 90;
  return /* @__PURE__ */ jsxDEV(
    Player,
    {
      component: ReplayComposition,
      durationInFrames,
      fps: 30,
      compositionWidth: 540,
      compositionHeight: 960,
      loop: true,
      controls: true,
      autoplay: true,
      inputProps: { replayData, prefetchedAvatarUrl },
      style: { width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%" },
      numberOfSharedAudioTags: 100
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 156,
      columnNumber: 9
    }
  );
};
root.render(/* @__PURE__ */ jsxDEV(RenderApp, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 172,
  columnNumber: 13
}));
