import React, { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

export default function ParticlesBG() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: true, zIndex: -1 },
        background: { color: { value: "#e3f2fd" } },
        particles: {
          color: { value: "#1976d2" },
          links: { enable: true, color: "#1976d2", opacity: 0.3 },
          move: { enable: true, speed: 1 },
          number: { value: 40 },
          opacity: { value: 0.5 },
          shape: { type: "circle" },
          size: { value: 3 }
        }
      }}
    />
  );
}