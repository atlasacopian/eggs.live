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
  // Store the target rotation value, updated on scroll
  const targetRotationX = useRef(Math.PI / 2.2); // Initial rotation

  // Update targetRotationX based on scroll
  useEffect(() => {
    const initialRotation = Math.PI / 2.2;
    const maxScroll = 500; // Pixels scrolled to reach max tilt
    const maxTilt = Math.PI / 12; // How much extra tilt (radians)

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Calculate additional tilt based on scroll, clamped between 0 and maxTilt
      const additionalTilt = THREE.MathUtils.mapLinear(scrollY, 0, maxScroll, 0, maxTilt);
      const clampedTilt = THREE.MathUtils.clamp(additionalTilt, 0, maxTilt);
      // Set the target rotation (initial + tilt)
      targetRotationX.current = initialRotation + clampedTilt;
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // No dependencies needed if onInteractionStart isn't used

  // Apply rotation smoothly in the animation frame
  useFrame(() => {
    if (centerRef.current) {
      // Lerp towards the target X rotation
      centerRef.current.rotation.x = THREE.MathUtils.lerp(
        centerRef.current.rotation.x,
        targetRotationX.current,
        0.1 // Smoothing factor
      );
      // Optional: Keep a very subtle constant Y rotation if desired
      // centerRef.current.rotation.y += 0.001;
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
        {/* Set initial rotation and Y position */}
        <Center ref={centerRef} rotation={[targetRotationX.current, 0, 0]} position={[0, 0.5, 0]}>
          <ModelPrimitive />
        </Center>
      </Suspense>
    </>
  )
}

// Main Scene component only sets up the Canvas
export default function EggCartonScene({ onInteractionStart }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Canvas camera={{ position: [0,2,12], fov:50 }} onCreated={({ scene }) => { scene.background = new THREE.Color(1,1,1) }}>
        <Experience onInteractionStart={onInteractionStart} />
      </Canvas>
    </div>
  )
} 