import React, { useRef, useEffect } from 'react';

const ParticlesBackground = ({ className = '' }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const particles = useRef([]);

  const particleCount = 60; // ✅ reducido
  const maxVelocity = 0.25;
  const maxRadius = 1.2;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Colores simples
    const randomColor = () =>
      ['#ffffff', '#c2d3ff', '#d2bfff'][Math.floor(Math.random() * 3)];

    particles.current = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * maxVelocity,
      vy: (Math.random() - 0.5) * maxVelocity,
      radius: Math.random() * maxRadius + 0.4,
      alpha: Math.random() * 0.5 + 0.4,
      color: randomColor()
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} absolute inset-0 w-full h-full pointer-events-none z-0`}
    />
  );
};

export default ParticlesBackground;
