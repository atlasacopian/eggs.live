'use client';

import React, { useEffect, useRef } from 'react';

const DEFAULT_BOUNDS = { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 };
const GRID_COLS = 90;

// Density color ramp: dark (empty) -> green -> yellow -> red (hottest).
function densityColor(t) {
  if (t <= 0) return null;
  if (t < 0.5) {
    const u = t / 0.5;
    return `rgb(${Math.round(20 + u * 40)}, ${Math.round(120 + u * 135)}, ${Math.round(40 - u * 20)})`;
  }
  const u = (t - 0.5) / 0.5;
  return `rgb(${Math.round(60 + u * 195)}, ${Math.round(255 - u * 155)}, ${Math.round(20 - u * 20)})`;
}

export default function StoreHeatMap({ points, bounds, error }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!points || !points.length) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const b = bounds || DEFAULT_BOUNDS;
    const lngSpan = b.maxLng - b.minLng;
    const latSpan = b.maxLat - b.minLat;
    const rows = Math.round(GRID_COLS * (latSpan / lngSpan));

    const draw = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Bin points into a grid over the given lat/lng bounds.
      const grid = new Array(rows * GRID_COLS).fill(0);
      for (const p of points) {
        if (p.lat < b.minLat || p.lat > b.maxLat || p.lng < b.minLng || p.lng > b.maxLng) continue;
        const col = Math.min(GRID_COLS - 1, Math.floor(((p.lng - b.minLng) / lngSpan) * GRID_COLS));
        const row = Math.min(rows - 1, Math.floor(((b.maxLat - p.lat) / latSpan) * rows));
        grid[row * GRID_COLS + col] += 1;
      }
      const maxCount = Math.max(1, ...grid);

      const cellW = width / GRID_COLS;
      const cellH = height / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const count = grid[row * GRID_COLS + col];
          if (!count) continue;
          // Sqrt scale so a handful of dense metro cells don't wash out everywhere else.
          const t = Math.sqrt(count / maxCount);
          const color = densityColor(t);
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(col * cellW, row * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    };

    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [points, bounds]);

  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load store map.</div>;
  }
  if (!points) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading store map…</div>;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: 4, right: 8, fontSize: '0.65rem', color: '#666',
      }}>
        density: low → high
      </div>
    </div>
  );
}
