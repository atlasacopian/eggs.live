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
  const mouse = useRef({ x: 0, y: 0 })
  const touch = useRef({ startX: 0, currentX: 0, isDragging: false, targetYRotation: 0 })
  const [isMobile, setIsMobile] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const checkMobile = () => window.matchMedia('(pointer: coarse)').matches;
    setIsMobile(checkMobile());
  }, []);

  // Add conditional event listeners based on device type
  useEffect(() => {
    if (isMobile) {
      // --- Touch Listeners --- 
      const handleTouchStart = (e) => {
        if (e.touches.length > 0) {
          touch.current.startX = e.touches[0].clientX;
          touch.current.currentX = e.touches[0].clientX;
          touch.current.isDragging = true;
          onInteractionStart?.(); // Trigger interaction if needed
        }
      };
      const handleTouchMove = (e) => {
        if (touch.current.isDragging && e.touches.length > 0) {
          touch.current.currentX = e.touches[0].clientX;
          // Calculate drag delta and map it to rotation (adjust sensitivity)
          const deltaX = touch.current.currentX - touch.current.startX;
          // Map deltaX (e.g., -100 to 100) to a rotation range (e.g., -PI/4 to PI/4)
          touch.current.targetYRotation = THREE.MathUtils.mapLinear(deltaX, -150, 150, -Math.PI / 4, Math.PI / 4);
          // Clamp rotation to prevent excessive spinning
          touch.current.targetYRotation = THREE.MathUtils.clamp(touch.current.targetYRotation, -Math.PI / 3, Math.PI / 3);
        }
      };
      const handleTouchEnd = () => {
        touch.current.isDragging = false;
        // Optional: Lerp back to center slowly?
        // touch.current.targetYRotation = 0; 
      };
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);
      };

    } else {
      // --- Mouse Listener --- 
      const handleMouseMove = (e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
        onInteractionStart?.();
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isMobile, onInteractionStart]) // Re-run if isMobile changes


  useFrame(() => {
    if (centerRef.current) {
      if (isMobile) {
        // Mobile: Lerp Y rotation based on touch drag
        centerRef.current.rotation.y = THREE.MathUtils.lerp(centerRef.current.rotation.y, touch.current.targetYRotation, 0.1);
        // Keep X rotation fixed or add subtle constant rotation?
        // centerRef.current.rotation.x = Math.PI / 2.2; // Fixed 
      } else {
        // Desktop: Lerp rotation based on mouse position
        const targetY = mouse.current.x * 0.5 // Rotate Y based on mouse X
        const targetX = mouse.current.y * 0.5 // Rotate X based on mouse Y
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
    // Remove pointerEvents: none to allow touch interaction
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Canvas camera={{ position: [0,2,12], fov:50 }} onCreated={({ scene }) => { scene.background = new THREE.Color(1,1,1) }}>
        <Experience onInteractionStart={onInteractionStart} />
      </Canvas>
    </div>
  )
} 