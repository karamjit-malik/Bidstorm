import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Lightformer, ContactShadows, MeshDistortMaterial } from '@react-three/drei';
import type { Group, Mesh } from 'three';

/**
 * A single dramatic centerpiece — a slowly turning faceted "gem" (the auction
 * prize) in glass/crystal, ringed by a thin metallic halo and a few drifting
 * shards. Glossy lighting + contact shadow + environment reflections give it a
 * cinematic, premium feel without any post-processing pass.
 */
function Centerpiece() {
  const group = useRef<Group>(null);
  const gem = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      // Gentle mouse parallax.
      const { x, y } = state.pointer;
      group.current.rotation.x += (y * 0.25 - group.current.rotation.x) * 0.04;
      group.current.position.x += (x * 0.4 - group.current.position.x) * 0.04;
    }
    if (gem.current) gem.current.rotation.z += delta * 0.25;
  });

  const shards = [
    { pos: [2.8, 1.2, -1] as const, s: 0.32, c: '#a855f7' },
    { pos: [-3, -0.8, -0.6] as const, s: 0.42, c: '#818cf8' },
    { pos: [2.2, -1.8, 0.6] as const, s: 0.26, c: '#e879f9' },
    { pos: [-2.4, 1.9, 0.2] as const, s: 0.3, c: '#6366f1' },
  ];

  return (
    <group ref={group}>
      {/* Faceted gem core — glossy metallic crystal that renders on any GPU. */}
      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={0.9}>
        <mesh ref={gem} scale={1.6}>
          <icosahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color="#6d28d9"
            emissive="#4c1d95"
            emissiveIntensity={0.5}
            roughness={0.08}
            metalness={0.85}
            distort={0.28}
            speed={1.4}
          />
        </mesh>
      </Float>

      {/* Inner glowing seed peeking through the facets */}
      <mesh scale={0.62}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* Metallic halo */}
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
          <torusGeometry args={[2.5, 0.03, 16, 120]} />
          <meshStandardMaterial color="#e9d5ff" emissive="#a855f7" emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
      </Float>

      {/* Drifting shards */}
      {shards.map((sh, i) => (
        <Float key={i} speed={1.4 + i * 0.35} rotationIntensity={1.2} floatIntensity={1.6}>
          <mesh position={sh.pos} scale={sh.s}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={sh.c} emissive={sh.c} emissiveIntensity={0.5} roughness={0.15} metalness={0.6} toneMapped={false} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <spotLight position={[6, 8, 6]} angle={0.4} penumbra={1} intensity={2.8} color="#e0e7ff" />
        <pointLight position={[-6, -2, 3]} intensity={3} color="#a855f7" />
        <pointLight position={[5, 2, -4]} intensity={2.4} color="#6366f1" />
        <Centerpiece />
        <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={12} blur={3} far={4} color="#4c1d95" />
        {/* Reflections come from inline lightformers — no remote HDR fetch, so
            the metallic gem renders instantly and offline. */}
        <Environment resolution={256}>
          <Lightformer position={[0, 4, -6]} scale={[10, 6, 1]} intensity={2.2} color="#c4b5fd" />
          <Lightformer position={[-6, -1, 2]} scale={[6, 6, 1]} intensity={3} color="#a855f7" />
          <Lightformer position={[6, 2, 3]} scale={[6, 6, 1]} intensity={2.4} color="#6366f1" />
          <Lightformer position={[0, -5, 1]} scale={[10, 4, 1]} intensity={1.4} color="#4338ca" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
