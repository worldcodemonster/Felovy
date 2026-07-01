'use client';

import { useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

export type CharacterState = 'idle' | 'greeting' | 'thinking' | 'happy';

const MODEL_FILE = '/models/stacy.glb';

const ANIMS: Record<CharacterState, string> = {
  idle: 'idle',
  greeting: 'wave',
  thinking: 'shrug',
  happy: 'react',
};

useGLTF.preload(MODEL_FILE);

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0.3, 0);
  }, [camera]);
  return null;
}

function StacyModel({ state }: { state: CharacterState }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_FILE);
  const { actions } = useAnimations(animations, group);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const name = ANIMS[state];
    const next = actions[name];
    if (!next) return;
    Object.values(actions).forEach(a => a?.fadeOut(0.3));
    next.reset().fadeIn(0.3).play();
  }, [state, actions]);

  return (
    <group ref={group}>
      <primitive object={clonedScene} scale={1.5} position={[0, -1.0, 0]} />
    </group>
  );
}

interface Props {
  state?: CharacterState;
  width?: number;
  height?: number;
}

export function Fantasy3DCharacter({ state = 'idle', width = 90, height = 160 }: Props) {
  return (
    <div style={{ width, height, flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0.2, 3.8], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <CameraSetup />
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 4]} intensity={1.6} />
          <pointLight position={[-3, 3, -2]} intensity={0.8} color="#a855f7" />
          <pointLight position={[2, -1, 3]} intensity={0.5} color="#fbbf24" />
          <Environment preset="sunset" />
          <PresentationControls
            global
            polar={[-0.06, 0.06]}
            azimuth={[-0.2, 0.2]}
            speed={1.5}
          >
            <StacyModel state={state} />
          </PresentationControls>
          <ContactShadows
            position={[0, -1.0, 0]}
            opacity={0.35}
            scale={2}
            blur={1.5}
            far={1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
