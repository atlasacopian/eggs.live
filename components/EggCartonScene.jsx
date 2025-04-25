'use client'

import { useRef, useEffect, Suspense } from 'react'
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
  const initialY = useRef(0.5); // Store initial Y position

  // Remove mousemove effect
  // useEffect(() => {
  //   const handleMouseMove = (e) => { ... }
  //   window.addEventListener('mousemove', handleMouseMove)
  //   return () => window.removeEventListener('mousemove', handleMouseMove)
  // }, [onInteractionStart])

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (centerRef.current) {
        // Calculate target Y based on scroll, keep it subtle
        const scrollY = window.scrollY;
        // Map scroll range (e.g., 0-500px) to a small position change (e.g., initialY to initialY - 0.3)
        const targetY = initialY.current - THREE.MathUtils.mapLinear(scrollY, 0, 500, 0, 0.3);
        // Clamp the target Y to prevent excessive movement
        const clampedTargetY = THREE.MathUtils.clamp(targetY, initialY.current - 0.3, initialY.current);
        
        // Lerp position.y for smooth transition
        centerRef.current.position.y = THREE.MathUtils.lerp(centerRef.current.position.y, clampedTargetY, 0.1);
        
        // Optional: Trigger interaction on scroll if needed
        // onInteractionStart?.(); 
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onInteractionStart]) // Keep dependency array if onInteractionStart is used

  // Remove mouse-based rotation from useFrame
  useFrame(() => {
    // if (centerRef.current) {
    //   const targetY = mouse.current.x * 0.5
    //   const targetX = mouse.current.y * 0.5
    //   centerRef.current.rotation.y = THREE.MathUtils.lerp(centerRef.current.rotation.y, targetY, 0.1)
    //   centerRef.current.rotation.x = THREE.MathUtils.lerp(centerRef.current.rotation.x, targetX, 0.1)
    // }
  })

  return (
    <>
      {/* Lighting & eggs */}
      <ambientLight intensity={0.8} />
      <pointLight color='#ffc107' intensity={1.2} distance={20} decay={2} position={[0,5,10]} />
      <directionalLight position={[10,10,5]} intensity={1.5} />
      <directionalLight position={[-10,-10,-5]} intensity={1} />
      <Suspense fallback={null}>
        {/* Initial Y position set here */}
        <Center ref={centerRef} rotation={[Math.PI / 2.2, 0, 0]} position={[0, initialY.current, 0]}>
          <ModelPrimitive />
        </Center>
      </Suspense>
    </>
  )
}

// Main Scene component only sets up the Canvas
export default function EggCartonScene({ onInteractionStart }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 /*, pointerEvents: 'none' remove this to allow scroll? */ }}>
      <Canvas camera={{ position: [0,2,12], fov:50 }} onCreated={({ scene }) => { scene.background = new THREE.Color(1,1,1) }}>
        <Experience onInteractionStart={onInteractionStart} />
      </Canvas>
    </div>
  )
} 