'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================
   Cảnh 3D hero (trang chủ công khai) — "cục tạ trừu tượng"
   - Chỉ tải trên DESKTOP có WebGL, tắt khi tab ẩn / cuộn ra xa
   - Không shadow, không post-processing, không asset mạng
   - Khi không bật: wrapper trong suốt → lộ ảnh hero.jpg phía sau
   ============================================================ */

const NEON = '#B7FF00';
const METAL_DARK = '#22272C';

/** Cục tạ xoay chậm — vòng neon phát sáng ở đầu tạ. */
function Dumbbell() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    // Nghiêng nhẹ theo con trỏ (parallax) — lerp để chuyển động mượt
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      state.pointer.y * 0.16,
      0.05,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      -state.pointer.x * 0.1,
      0.05,
    );
  });

  return (
    <group ref={group}>
      {/* Thanh tạ dọc */}
      <mesh>
        <cylinderGeometry args={[0.085, 0.085, 2.5, 32]} />
        <meshStandardMaterial color={METAL_DARK} metalness={0.92} roughness={0.32} />
      </mesh>

      {/* Vòng grip neon giữa thanh */}
      {[-0.16, 0, 0.16].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.095, 0.012, 10, 40]} />
          <meshStandardMaterial
            color={NEON}
            emissive={NEON}
            emissiveIntensity={0.7}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Hai đầu tạ */}
      {[-1, 1].map((side) => (
        <group key={side} position={[0, side * 1.12, 0]}>
          <RoundedBox args={[0.92, 0.3, 0.92]} radius={0.09} smoothness={4}>
            <meshStandardMaterial color="#1C2126" metalness={0.85} roughness={0.34} />
          </RoundedBox>
          <RoundedBox
            args={[0.74, 0.26, 0.74]}
            radius={0.08}
            smoothness={4}
            position={[0, side * 0.26, 0]}
          >
            <meshStandardMaterial color={METAL_DARK} metalness={0.88} roughness={0.32} />
          </RoundedBox>
          {/* Viền neon ôm mép cục tạ — điểm nhấn thương hiệu, thấy rõ khi xoay */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.47, 0.016, 12, 64]} />
            <meshStandardMaterial
              color={NEON}
              emissive={NEON}
              emissiveIntensity={1.1}
              metalness={0.2}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Các hình khối kim loại nhỏ quay quanh (cảm giác chuyển động thể thao). */
function Orbiters() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.16;
  });

  const items = [
    { pos: [2.15, 0.7, -0.6] as [number, number, number], neon: false },
    { pos: [-2.2, -0.5, -0.9] as [number, number, number], neon: false },
    { pos: [1.7, -1.5, 0.2] as [number, number, number], neon: true },
    { pos: [-1.6, 1.6, 0.1] as [number, number, number], neon: false },
  ];

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <Float key={i} speed={1.4 + i * 0.2} rotationIntensity={0.4} floatIntensity={0.6}>
          <mesh position={it.pos}>
            <icosahedronGeometry args={[it.neon ? 0.11 : 0.16, 0]} />
            <meshStandardMaterial
              color={it.neon ? NEON : METAL_DARK}
              emissive={it.neon ? NEON : '#000000'}
              emissiveIntensity={it.neon ? 0.8 : 0}
              metalness={0.85}
              roughness={0.35}
              wireframe={false}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Hạt bụi mờ tạo chiều sâu — rất rẻ về hiệu năng. */
function Dust({ count = 70 }: { count?: number }) {
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 11;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1.5;
    }
    return arr;
  }, [count]);

  const points = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (points.current) points.current.rotation.y = state.clock.elapsedTime * 0.018;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        color="#9AA0A6"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      {/* Key light trắng từ trên phải */}
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#FFFFFF" />
      {/* Rim neon từ dưới trái — điểm nhấn thương hiệu, có kiểm soát */}
      <pointLight
        position={[-3.4, -2.2, 2.6]}
        intensity={18}
        distance={12}
        decay={2}
        color={NEON}
      />
      {/* Ánh nền mờ làm nổi cạnh kim loại */}
      <pointLight
        position={[2.5, 3.5, -3.5]}
        intensity={9}
        distance={14}
        decay={2}
        color="#FFFFFF"
      />

      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.5}>
        <Dumbbell />
      </Float>
      <Orbiters />
      <Dust />
    </>
  );
}

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

interface Hero3DCanvasProps {
  className?: string;
}

/**
 * Wrapper cảnh 3D cho hero:
 * - Tự kiểm tra WebGL + viewport desktop + prefers-reduced-motion
 * - Tạm dừng render khi tab ẩn hoặc cuộn ra khỏi khung nhìn
 * - Không hỗ trợ → render `null`, để lộ ảnh nền fallback phía sau
 */
export default function Hero3DCanvas({ className }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const webgl = canUseWebGL();
    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setEnabled(webgl && desktop.matches && !reduce.matches);
    apply();

    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.04,
    });
    if (containerRef.current) io.observe(containerRef.current);

    desktop.addEventListener('change', apply);
    reduce.addEventListener('change', apply);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      desktop.removeEventListener('change', apply);
      reduce.removeEventListener('change', apply);
      io.disconnect();
    };
  }, []);

  const running = enabled && inView && tabVisible;

  return (
    <div ref={containerRef} className={className} aria-hidden>
      {enabled && (
        <>
          {/* Nền tối cinematic — ảnh hero.jpg phía sau chỉ là fallback */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 12%, rgb(var(--surface)) 0%, rgb(var(--ink)) 68%)',
            }}
          />
          <Canvas
            frameloop={running ? 'always' : 'never'}
            dpr={[1, 1.75]}
            camera={{ position: [0, 0.2, 6.2], fov: 40 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Scene />
          </Canvas>
        </>
      )}
    </div>
  );
}
