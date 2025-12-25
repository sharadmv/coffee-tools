import React, { useEffect, useRef } from 'react';

interface LiveVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isConnected: boolean;
}

const LiveVisualizer: React.FC<LiveVisualizerProps> = ({ analyserRef, isConnected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!isConnected || !analyserRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 60;
      
      // Calculate volume/intensity
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const intensity = avg / 255;
      
      // Draw outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius + 40 + (intensity * 50));
      gradient.addColorStop(0, 'rgba(217, 119, 6, 0.4)');
      gradient.addColorStop(1, 'rgba(217, 119, 6, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + 50 + (intensity * 50), 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw frequency bars in a circle
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const angle = (i / bufferLength) * Math.PI * 2;
        
        const innerDist = baseRadius + (intensity * 10);
        const outerDist = innerDist + (percent * 60);
        
        const x1 = centerX + Math.cos(angle) * innerDist;
        const y1 = centerY + Math.sin(angle) * innerDist;
        const x2 = centerX + Math.cos(angle) * outerDist;
        const y2 = centerY + Math.sin(angle) * outerDist;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        // Dynamic coloring
        const hue = 20 + (percent * 30); // 20-50 range (amber/gold)
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.5 + (percent * 0.5)})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Center orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + (intensity * 5), 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f59e0b';
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isConnected, analyserRef]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full h-full"
    />
  );
};

export default LiveVisualizer;