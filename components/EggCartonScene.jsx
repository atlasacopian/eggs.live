'use client'

import { useRef, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

// Simple component to load the model
function ModelPrimitive(props) {
  const { scene } = useGLTF('/placeholder_egg.glb')
  // Reduce scale further
  return <primitive object={scene} scale={1.0} {...props} />
}

// Static Experience component for egg carton
function Experience({ onInteractionStart }) {
  const centerRef = useRef()
  const mouse = useRef({ x: 0, y: 0 }) // For desktop mouse tracking
  const [isMobile, setIsMobile] = useState(false);
  const initialRotationX = Math.PI / 4; // Keep initial tilt

  // Detect touch device on mount
  useEffect(() => {
    const checkMobile = () => window.matchMedia('(pointer: coarse)').matches;
    setIsMobile(checkMobile());
  }, []);

  // Add mouse listener only if not mobile
  useEffect(() => {
    if (!isMobile) {
      const handleMouseMove = (e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
        onInteractionStart?.(); // Trigger interaction if needed
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
    // No cleanup needed if mobile, as listener wasn't added
  }, [isMobile, onInteractionStart]) 


  // Apply animation based on device type
  useFrame((state, delta) => {
    if (centerRef.current) { 
      if (isMobile) { 
        // Mobile: Subtle constant rotation around the initial tilt
        centerRef.current.rotation.y += delta * 0.1; // Slow spin
        centerRef.current.rotation.x = initialRotationX + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      } else {
        // Desktop: Follow mouse (Reverted targetX calculation)
        const targetY = mouse.current.x * 0.5 // Rotate Y based on mouse X
        const targetX = mouse.current.y * 0.5 // Rotate X directly based on mouse Y (original logic)
        centerRef.current.rotation.y = THREE.MathUtils.lerp(centerRef.current.rotation.y, targetY, 0.1)
        centerRef.current.rotation.x = THREE.MathUtils.lerp(centerRef.current.rotation.x, targetX, 0.1)
      }
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
        {/* Use new initial rotation */}
        <Center ref={centerRef} rotation={[initialRotationX, 0, 0]} position={[0, 0.5, 0]}>
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