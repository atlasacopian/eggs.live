'use client'

import { useRef, useEffect, Suspense, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { Center, Html, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Preload the updated egg GLB so it's ready when the scene mounts
useGLTF.preload('/updated_egg.glb')

// Update ModelPrimitive for immediate load
function ModelPrimitive(props) {
  // Load GLB model using useGLTF and clone directly for fast initial rendering
  const gltf = useGLTF('/updated_egg.glb')
  // Load original bump and gloss textures from White_Egg
  const [bumpMap, glossMap] = useTexture([
    '/White_Egg/Egg_bump.png',
    '/White_Egg/EGG_Gloss.png'
  ])

  // Tile textures to avoid UV seam
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  glossMap.wrapS = glossMap.wrapT = THREE.RepeatWrapping

  const model = useMemo(() => {
    const cloned = gltf.scene.clone()
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        // Weld and smooth geometry to remove UV seam
        let geo = child.geometry.clone()
        geo = mergeVertices(geo)
        if (geo.attributes.uv) {
          geo.setAttribute('uv2', geo.attributes.uv)
        }
        geo.computeVertexNormals()
        child.geometry = geo
        // Apply original egg material properties
        const mat = child.material;
        // Use base white diffuse from MTL Kd
        mat.color = new THREE.Color(0.941177, 0.941177, 0.941177);
        // Subtle bump for light surface detail
        mat.bumpMap = bumpMap
        mat.bumpScale = 0.06
        // Remove roughnessMap to avoid visible seam artifacts from the map
        delete mat.roughnessMap
        mat.roughness = 0.85
        // Egg is non-metallic
        mat.metalness = 0.0
        // Increase environment reflection intensity
        mat.envMapIntensity = 1.0
        mat.needsUpdate = true;
      }
    })
    return cloned
  }, [gltf, bumpMap, glossMap])

  return <primitive object={model} scale={0.375} {...props} />
}

// Static Experience component for egg carton
function Experience({ onInteractionStart }) {
  const centerRef = useRef()
  const mouse = useRef({ x: 0, y: 0 }) // For desktop mouse tracking
  const [isMobile, setIsMobile] = useState(false);
  // Original tilt plus vertical rotation
  const initialRotationX = 0; // No tilt on X axis for upright orientation
  const initialRotationY = 0; // Face front with no Y-axis rotation
  const initialRotationZ = 0; // No Z-axis rotation for upright orientation

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
        <Center ref={centerRef} rotation={[initialRotationX, initialRotationY, initialRotationZ]} position={[0, 0, 0]}>
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
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <Canvas
          camera={{ position: [2, 3, 6], fov: 35 }}
          onCreated={({ scene, camera }) => {
            scene.background = null; // True transparency
            camera.lookAt(0, 0, 0); // aim at world origin to center the egg
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