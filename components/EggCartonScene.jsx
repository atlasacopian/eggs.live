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
  // Restore mouse ref
  const mouse = useRef({ x: 0, y: 0 })
  // Remove targetRotationX ref
  // const targetRotationX = useRef(Math.PI / 2.2);

  // Restore mousemove effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      onInteractionStart?.(); // Trigger interaction if needed
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [onInteractionStart])

  // Remove scroll listener effect
  // useEffect(() => {
  //   const handleScroll = () => { ... }
  //   window.addEventListener('scroll', handleScroll, { passive: true })
  //   return () => window.removeEventListener('scroll', handleScroll)
  // }, [])

  // Restore mouse-based rotation in useFrame
  useFrame(() => {
    if (centerRef.current) {
      // Lerp towards target rotation based on mouse position
      const targetY = mouse.current.x * 0.5 // Rotate around Y axis based on mouse X
      const targetX = mouse.current.y * 0.5 // Rotate around X axis based on mouse Y
      centerRef.current.rotation.y = THREE.MathUtils.lerp(centerRef.current.rotation.y, targetY, 0.1)
      centerRef.current.rotation.x = THREE.MathUtils.lerp(centerRef.current.rotation.x, targetX, 0.1)
      
      // Remove test rotation
      // const initialRotation = Math.PI / 2.2;
      // const maxTilt = Math.PI / 12;
      // centerRef.current.rotation.x = initialRotation + Math.sin(state.clock.elapsedTime * 0.5) * (maxTilt / 2); 
      // centerRef.current.rotation.y += delta * 0.1; 
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
    // Restore pointerEvents: none as mousemove doesn't need scroll
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0,2,12], fov:50 }} onCreated={({ scene }) => { scene.background = new THREE.Color(1,1,1) }}>
        <Experience onInteractionStart={onInteractionStart} />
      </Canvas>
    </div>
  )
} 