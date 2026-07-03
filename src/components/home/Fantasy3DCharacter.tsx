'use client';

import { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export type CharacterState = 'idle' | 'greeting' | 'thinking' | 'happy';

const MODEL_FILE = '/models/rpm.glb';

const ANIM_FILES: Record<CharacterState, string> = {
  idle: '/models/animations/idle.glb',
  greeting: '/models/animations/greeting.glb',
  thinking: '/models/animations/thinking.glb',
  happy: '/models/animations/happy.glb',
};

const STATE_LIGHT: Record<CharacterState, string> = {
  idle: '#e11d48',
  greeting: '#f472b6',
  thinking: '#a855f7',
  happy: '#fbbf24',
};

useGLTF.preload(MODEL_FILE);
(Object.values(ANIM_FILES) as string[]).forEach((file) => useGLTF.preload(file));

function useAnimationClips() {
  const idle = useGLTF(ANIM_FILES.idle);
  const greeting = useGLTF(ANIM_FILES.greeting);
  const thinking = useGLTF(ANIM_FILES.thinking);
  const happy = useGLTF(ANIM_FILES.happy);

  return useMemo(() => {
    const tag = (clips: THREE.AnimationClip[], state: CharacterState) => {
      if (!clips.length) return [];
      const clip = clips[0].clone();
      clip.name = state;
      return [clip];
    };

    return [
      ...tag(idle.animations, 'idle'),
      ...tag(greeting.animations, 'greeting'),
      ...tag(thinking.animations, 'thinking'),
      ...tag(happy.animations, 'happy'),
    ];
  }, [idle, greeting, thinking, happy]);
}

function FeliModel({ state, variant }: { state: CharacterState; variant: 'portrait' | 'mini' }) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const { scene } = useGLTF(MODEL_FILE);
  const clips = useAnimationClips();
  const { actions } = useAnimations(clips, group);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const lookTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material && 'envMapIntensity' in obj.material) {
          (obj.material as THREE.MeshStandardMaterial).envMapIntensity = 0.85;
        }
      }
      if (obj.name === 'Head') headRef.current = obj;
    });
  }, [clonedScene]);

  useEffect(() => {
    const action = actions[state];
    if (!action) return;
    Object.values(actions).forEach((a) => a?.fadeOut(0.35));
    action.reset().fadeIn(0.35).play();
    if (state === 'greeting' || state === 'happy') {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [state, actions]);

  useFrame(({ pointer, clock }) => {
    const head = headRef.current;
    if (!head) return;
    lookTarget.current.set(pointer.x * 0.35, pointer.y * 0.18 + Math.sin(clock.elapsedTime * 1.2) * 0.02, 1);
    head.lookAt(lookTarget.current);
    head.rotation.x *= 0.55;
    head.rotation.y *= 0.55;
    head.rotation.z *= 0.2;
  });

  const scale = variant === 'mini' ? 2.35 : 2.65;
  const yPos = variant === 'mini' ? -1.48 : -1.42;

  return (
    <group ref={group}>
      <primitive object={clonedScene} scale={scale} position={[0, yPos, 0]} rotation={[0, 0.05, 0]} />
    </group>
  );
}

function SceneContent({ state, variant }: { state: CharacterState; variant: 'portrait' | 'mini' }) {
  const accent = STATE_LIGHT[state];

  return (
    <>
      <color attach="background" args={['transparent']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 4, 3]} intensity={1.4} color="#fff7fb" />
      <pointLight position={[-1.5, 2, 1.5]} intensity={1.1} color={accent} />
      <pointLight position={[1.8, 1.2, 2]} intensity={0.55} color="#fdf4ff" />
      <spotLight
        position={[0, 2.5, 1.2]}
        angle={0.45}
        penumbra={0.8}
        intensity={0.9}
        color={accent}
      />

      <Float speed={1.4} rotationIntensity={0.04} floatIntensity={0.35}>
        <FeliModel state={state} variant={variant} />
      </Float>

      {state === 'happy' && (
        <Sparkles count={variant === 'mini' ? 12 : 28} scale={1.2} size={2} speed={0.35} color="#fde68a" />
      )}

      <ContactShadows
        position={[0, -1.42, 0]}
        opacity={0.28}
        scale={1.4}
        blur={2.2}
        far={1.2}
        color="#881337"
      />
    </>
  );
}

interface Props {
  state?: CharacterState;
  width?: number;
  height?: number;
  variant?: 'portrait' | 'mini';
}

export function Fantasy3DCharacter({
  state = 'idle',
  width = 90,
  height = 160,
  variant,
}: Props) {
  const resolvedVariant = variant ?? (height <= 70 ? 'mini' : 'portrait');
  const camZ = resolvedVariant === 'mini' ? 0.95 : 1.05;
  const camY = resolvedVariant === 'mini' ? 1.58 : 1.62;

  return (
    <div style={{ width, height, flexShrink: 0 }} className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 38%, ${STATE_LIGHT[state]}33 0%, transparent 68%)`,
        }}
      />
      <Canvas
        camera={{ position: [0, camY, camZ], fov: resolvedVariant === 'mini' ? 42 : 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.58, 0);
        }}
      >
        <Suspense fallback={null}>
          <SceneContent state={state} variant={resolvedVariant} />
        </Suspense>
      </Canvas>
    </div>
  );
}
