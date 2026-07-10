import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, MeshDistortMaterial, Icosahedron, Torus } from '@react-three/drei';
import type { Group, Mesh } from 'three';

/**
 * A slowly rotating cluster of glass-like brand-tinted solids. Deliberately
 * abstract (not a literal gavel) so it reads as "premium / high-energy" rather
 * than clip-art. Kept lightweight: a handful of meshes, no post-processing.
 */
function Cluster() {
  const group = useRef<Group>(null);
  const core = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
    if (core.current) {
      core.current.rotation.x += delta * 0.2;
      core.current.rotation.z += delta * 0.1;
    }
  });

  // Small orbiting satellites placed once.
  const satellites = useMemo(
    () => [
      { pos: [2.6, 0.8, -1] as const, scale: 0.5, color: '#a855f7' },
      { pos: [-2.7, -0.6, -0.5] as const, scale: 0.65, color: '#818cf8' },
      { pos: [1.8, -1.6, 0.8] as const, scale: 0.4, color: '#e879f9' },
      { pos: [-1.9, 1.7, 0.4] as const, scale: 0.45, color: '#6366f1' },
    ],
    []
  );

  return (
    <group ref={group}>
      {/* Central distorted core */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
        <Icosahedron ref={core} args={[1.35, 4]}>
          <MeshDistortMaterial
            color="#7c3aed"
            emissive="#4338ca"
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.6}
            distort={0.35}
            speed={1.6}
          />
        </Icosahedron>
      </Float>

      {/* Halo ring */}
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
        <Torus args={[2.4, 0.045, 16, 100]} rotation={[Math.PI / 2.6, 0.3, 0]}>
          <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
        </Torus>
      </Float>

      {/* Orbiting satellites */}
      {satellites.map((s, i) => (
        <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={1} floatIntensity={1.5}>
          <mesh position={s.pos} scale={s.scale}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.25} roughness={0.15} metalness={0.7} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.4} color="#e0e7ff" />
        <pointLight position={[-5, -3, 2]} intensity={2} color="#a855f7" />
        <pointLight position={[5, 3, -3]} intensity={1.5} color="#6366f1" />
        <Cluster />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
