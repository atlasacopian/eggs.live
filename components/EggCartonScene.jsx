'use client'

import { useRef, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

// Simple component to load the model
function ModelPrimitive(props) {
  const { scene } = useGLTF('/dozen eggs 3d.glb')
  return <primitive object={scene} scale={1.8} {...props} />
}

// Static Experience component for egg carton
function Experience({ onInteractionStart }) {
  const centerRef = useRef()
  const [isMobile, setIsMobile] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const checkMobile = () => window.matchMedia('(pointer: coarse)').matches;
    setIsMobile(checkMobile());
  }, []);

  // Remove conditional listeners (no interaction needed for this version)
  // useEffect(() => {
  //   if (isMobile) { ... } else { ... }
  // }, [isMobile, onInteractionStart])

  // Apply subtle animation only on desktop
  useFrame((state, delta) => {
    if (centerRef.current && !isMobile) { // Only animate if NOT mobile
      // Slow constant spin on Y axis for desktop
      centerRef.current.rotation.y += delta * 0.1;
    }
  })

  return (
    <>
      {/* Lighting & eggs */}
      <ambientLight intensity={0.8} />
      <pointLight color='#ffc107' intensity={1.2} distance={20} decay={2} position={[0,5,10]} />
      <directionalLight position={[10,10,5]} intensity={1.5} />
      <directionalLight position={[-10,-10,-5]} intensity={1} />
      <Suspense fallback={null}>
        {/* Restore original rotation/position */}
        <Center ref={centerRef} rotation={[Math.PI / 2.2, 0, 0]} position={[0, 0.5, 0]}>
          <ModelPrimitive />
        </Center>
      </Suspense>
    </>
  )
}

// Main Scene component only sets up the Canvas
export default function EggCartonScene({ onInteractionStart }) {
  return (
    // Restore pointerEvents: none
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0,2,12], fov:50 }} onCreated={({ scene }) => { scene.background = new THREE.Color(1,1,1) }}>
        <Experience onInteractionStart={onInteractionStart} />
      </Canvas>
    </div>
  )
} 