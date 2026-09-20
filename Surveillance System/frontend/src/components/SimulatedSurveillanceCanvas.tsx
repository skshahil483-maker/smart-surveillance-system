import React, { useEffect, useRef } from 'react';

interface SimulatedCanvasProps {
  cameraName: string;
  isSuspicious?: boolean;
}

export const SimulatedSurveillanceCanvas: React.FC<SimulatedCanvasProps> = ({ cameraName, isSuspicious }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;

    // Simulated target positions
    let p1X = 220, p1Y = 180, p1Dx = 1.2, p1Dy = 0.8;
    let p2X = 380, p2Y = 220, p2Dx = -1.0, p2Dy = -0.6;
    let p3X = 140, p3Y = 280, p3Dx = 0.5, p3Dy = 0.2;

    const render = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      // Dark Surveillance Grid Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw Perspective Grid Lines (Room Layout)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Vertical perspective lines
      ctx.beginPath();
      ctx.moveTo(width * 0.2, 0); ctx.lineTo(0, height);
      ctx.moveTo(width * 0.4, 0); ctx.lineTo(width * 0.25, height);
      ctx.moveTo(width * 0.6, 0); ctx.lineTo(width * 0.75, height);
      ctx.moveTo(width * 0.8, 0); ctx.lineTo(width, height);
      ctx.stroke();

      // Horizontal grid lines
      for (let y = 50; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update positions
      p1X += p1Dx; p1Y += p1Dy;
      if (p1X < 180 || p1X > 320) p1Dx *= -1;
      if (p1Y < 140 || p1Y > 240) p1Dy *= -1;

      p2X += p2Dx; p2Y += p2Dy;
      if (p2X < 320 || p2X > 480) p2Dx *= -1;
      if (p2Y < 160 || p2Y > 280) p2Dy *= -1;

      p3X += p3Dx; p3Y += p3Dy;
      if (p3X < 100 || p3X > 200) p3Dx *= -1;
      if (p3Y < 240 || p3Y > 320) p3Dy *= -1;

      // Helper to draw target box
      const drawTarget = (x: number, y: number, w: number, h: number, label: string, color: string, isAlert: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = isAlert ? 2.5 : 1.5;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const len = 8;
        ctx.lineWidth = 3;
        // Top-left corner
        ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
        // Top-right corner
        ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
        // Bottom-left corner
        ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
        // Bottom-right corner
        ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();

        // Label Background
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 22, ctx.measureText(label).width + 12, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(label, x + 6, y - 8);
      };

      // Draw Simulated Person Targets
      // Person 1 (Fighting / Suspicious - Red)
      drawTarget(p1X, p1Y, 70, 130, 'Person 01 (Fighting)', '#ef4444', true);

      // Person 2 (Fighting / Suspicious - Red)
      drawTarget(p2X, p2Y, 65, 125, 'Person 02 (Fighting)', '#ef4444', true);

      // Person 3 (Normal / Walking - Green)
      drawTarget(p3X, p3Y, 60, 120, 'Person 03 (Walking)', '#10b981', false);

      // CCTV Scanline Effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      const scanY = (frameCount * 2) % height;
      ctx.fillRect(0, scanY, width, 4);

      // Camera Crosshair Overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 20, centerY); ctx.lineTo(centerX + 20, centerY);
      ctx.moveTo(centerX, centerY - 20); ctx.lineTo(centerX, centerY + 20);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full h-full object-cover"
      />
      {/* Simulation Watermark Banner */}
      <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-white tracking-widest uppercase shadow">
        STANDALONE SIMULATED FEED
      </div>
    </div>
  );
};
