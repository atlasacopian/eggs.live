'use client'

import { useRef, useEffect, Suspense, useState, useMemo, forwardRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Center, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Preload the original egg GLB so it's ready when the scene mounts
useGLTF.preload('/final.glb')

// Update ModelPrimitive for immediate load
const ModelPrimitive = forwardRef((props, ref) => {
  // Load GLB model using useGLTF and clone directly for fast initial rendering
  const gltf = useGLTF('/final.glb')

  const model = useMemo(() => {
    const cloned = gltf.scene.clone()
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        // Weld vertices to fix seams
        let geo = child.geometry.clone()
        geo = mergeVertices(geo)
        if (geo.attributes.uv) {
          geo.setAttribute('uv2', geo.attributes.uv)
        }
        child.geometry = geo

        const mat = child.material
        // Subtle off-white base color
        mat.color = new THREE.Color(0xf0f0f0)
        mat.roughness = 0.45
        mat.metalness = 0
        mat.envMapIntensity = 1
        mat.needsUpdate = true
      }
    })
    return cloned
  }, [gltf])

  return <primitive ref={ref} object={model} scale={6} {...props} />
})
ModelPrimitive.displayName = 'ModelPrimitive'

// Static Experience component for egg carton
export function Experience({ onInteractionStart }) {
  const centerRef = useRef()
  const mouse = useRef({ x: 0, y: 0 }) // For desktop mouse tracking
  const [isMobile, setIsMobile] = useState(false);

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
        // Mobile: Dynamic spin with oscillation
        centerRef.current.rotation.y += delta * 0.2; // Faster spin
        centerRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        centerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      } else {
        // Reduced sensitivity for a smoother, less aggressive tip
        const targetY = mouse.current.x * 0.5;
        const targetX = (mouse.current.y * 0.4) + (Math.abs(mouse.current.x) * 0.2);
        // Smooth interpolation for tipping
        centerRef.current.rotation.y = THREE.MathUtils.lerp(centerRef.current.rotation.y, targetY, 0.1);
        centerRef.current.rotation.x = THREE.MathUtils.lerp(centerRef.current.rotation.x, targetX, 0.1);
        // Clamp rotations for a gentler range
        centerRef.current.rotation.y = THREE.MathUtils.clamp(centerRef.current.rotation.y, -0.5, 0.5);
        centerRef.current.rotation.x = THREE.MathUtils.clamp(centerRef.current.rotation.x, -0.05, 0.5);
        // Reset any Z rotation to keep it stable
        centerRef.current.rotation.z = 0;
      }
    }
  })

  return (
    <>
      {/* Photorealistic studio environment */}
      <Environment preset="studio" background={false} />
      {/* Hemispheric fill for softer gradients and seam removal */}
      <hemisphereLight skyColor="#ffffff" groundColor="#ffffff" intensity={0.4} />
      {/* Soft ambient light */}
      <ambientLight intensity={0.2} />
      {/* Directional lights for subtle highlights */}
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      {/* Ground shadows */}
      <ContactShadows resolution={1024} position={[0, -0.01, 0]} scale={10} blur={2} far={0.5} opacity={0.5} />
      <Suspense fallback={null}>
        <Center ref={centerRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <group>
            <ModelPrimitive />
          </group>
        </Center>
      </Suspense>
    </>
  )
}

// Main Scene component only sets up the Canvas
export default function EggCartonScene({ onInteractionStart }) {
  return (
    <>
      {/* Push the entire canvas down so the logo and tagline have breathing room above the egg */}
      <div style={{ position: 'absolute', top: 320, left: 0, width: '100%', height: 'calc(100% - 320px)', zIndex: 0, pointerEvents: 'none' }}>
        <Canvas
          camera={{ position: [0, 0, 12], fov: 35 }}
          onCreated={({ scene, camera, gl }) => {
            // Restore transparent background
            scene.background = null;
            gl.setClearColor(0x000000, 0);
            camera.lookAt(0, 0, 0);
          }}
        >
          {/* Soft ambient fill to reduce harsh shadows */}
          <ambientLight intensity={0.5} />
          {/* Show model when ready, no loading UI */}
          <Suspense fallback={null}>
            <Experience onInteractionStart={onInteractionStart} />
          </Suspense>
        </Canvas>
      </div>
    </>
  )
} 