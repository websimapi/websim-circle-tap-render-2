# Implementation Detail: Hiding Extraneous UI Elements

To ensure a clean rendering environment for the video generation iframe, we implemented a mechanism to aggressively hide any HTML elements injected into the page body that aren't part of our application.

This is specifically handled in `main.jsx` within the `RenderApp` component using a `useEffect` hook.

## How it works

1.  **Targeting the Root**: We identify our application's root container (`#player-root`), which contains the React/Remotion player.
2.  **Scanning Body Children**: We scan all direct children of `document.body` (`document.body.children`).
3.  **Filtering & Hiding**:
    *   We iterate through these children.
    *   If a child is a `<div>` and is **not** our `#player-root`, we assume it is an injected UI overlay (often used by hosting platforms or extensions, sometimes containing Shadow DOM elements).
    *   We apply `child.style.display = 'none'` to hide it.
4.  **Continuous Cleanup**:
    *   Since these external elements are often injected asynchronously after the page loads, doing this once on mount isn't enough.
    *   We set up a `setInterval` that runs this cleanup check every **200ms**.

### Code Snippet (`main.jsx`)

```javascript
useEffect(() => {
    const cleanupInjectedUI = () => {
        const root = document.getElementById('player-root');
        if (!root) return;

        // Hide any extraneous divs (like injected UI overlays with shadow roots)
        Array.from(document.body.children).forEach(child => {
            if (child.tagName === 'DIV' && child !== root) {
                child.style.display = 'none';
            }
        });
    };

    // Run immediately
    cleanupInjectedUI();    

    // Run periodically to catch async injections
    const interval = setInterval(cleanupInjectedUI, 200);

    return () => clearInterval(interval);

}, []);
```

