'use client';
import { Canvas } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo, Suspense } from 'react'
import { OrbitControls, useGLTF, Center, Text } from '@react-three/drei'
import * as THREE from 'three'

// Detailed single egg GLB model
function EggModel(props) {
  const gltf = useGLTF('/white_egg.glb')
  console.log('Loaded GLTF scene:', gltf.scene)
  // Clone and enable shadows
  const sceneObj = useMemo(() => {
    const obj = gltf.scene.clone(true)
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return obj
  }, [gltf])
  // Render the cloned scene centered under the model
  return (
    <Center {...props} top>
      <primitive object={sceneObj} />
    </Center>
  )
}

function ChartFloor({ prices, progress = 1, muted = true, showLabels = false }) {
  // Memoize heavy geometry generation
  const { floorGroup } = useMemo(() => {
    const group = new THREE.Group()

    // Floor plane (black)
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#000' }))
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    group.add(plane)

    // Grid helper colored black for net
    const grid = new THREE.GridHelper(100, 100, '#000000', '#000000')
    grid.material.opacity = 0.3
    grid.material.transparent = true
    group.add(grid)

    return { floorGroup: group }
  }, [])

  // Chart tube geometry from price points
  const tubeMesh = useMemo(() => {
    if (!prices.length) return null
    // Determine dynamic Y scaling
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const height = 15 // vertical range units
    const width = 100
    const count = prices.length
    const segment = width / (count - 1)
    const points = prices.map((p, idx) => {
      const x = -width / 2 + idx * segment
      // normalize between 0 and 1, center at 0
      const norm = (p - minP) / (maxP - minP)
      const y = (norm - 0.5) * height
      return new THREE.Vector3(x, y, 0)
    })
    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeo = new THREE.TubeGeometry(curve, points.length * 5, 0.08, 16, false)
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffc107',
      emissive: '#ffc107',
      emissiveIntensity: muted ? 0.2 : 1,
      transparent: true,
      opacity: muted ? 0.4 : 1,
      metalness: 0.1,
      roughness: 0.4,
    })
    const mesh = new THREE.Mesh(tubeGeo, mat)
    mesh.position.y = 0.1 // lift above grid for clarity
    return mesh
  }, [prices, muted])

  // Axis labels: X (years) and Y (prices)
  const axesLabels = useMemo(() => {
    if (!prices.length) return null
    const years = [2020,2021,2022,2023,2024,2025]
    const ticks = [0,2.5,5,7.5,10]
    const n = prices.length
    const xAxis = years.map((year) => {
      const idx = (year - 2020) / 5 * (n - 1)
      const x = idx * 0.15 - 10
      return (
        <Text key={year} position={[x, -0.5, 0]} fontSize={0.4} color='#ffc107' anchorX='center'>{year}</Text>
      )
    })
    const yAxis = ticks.map((val) => {
      const y = val * 0.03
      return (
        <Text key={val} position={[-10.5, y, 0]} fontSize={0.4} color='#ffc107' anchorY='middle' anchorX='right'>{`$${val}`}</Text>
      )
    })
    return [...xAxis, ...yAxis]
  }, [prices])

  // Update draw range based on progress
  useEffect(() => {
    if (tubeMesh) {
      const geom = tubeMesh.geometry
      if (geom.index) {
        const total = geom.index.count
        geom.setDrawRange(0, Math.floor(total * progress))
      }
    }
  }, [progress, tubeMesh])

  return (
    <group>
      {/* Static floor/grids */}
      <primitive object={floorGroup} />
      {tubeMesh && <primitive object={tubeMesh} />}
      {/* Draw axis labels only when requested */}
      {showLabels && axesLabels}
    </group>
  )
}

// Fallback sphere if GLTF fails
function FallbackEgg(props) {
  return (
    <mesh {...props} castShadow receiveShadow scale={[1, 1.3, 1]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color={'white'} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

export default function EggChartScene({ showHistory = false }) {
  const groupRef = useRef()
  const camRef = useRef()
  const [prices, setPrices] = useState([])
  const [latest, setLatest] = useState(null)
  const [progress, setProgress] = useState(1) // draw progress 0→1

  // Mouse rotation
  useEffect(() => {
    const mouse = { x: 0, y: 0 }
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      if (groupRef.current) {
        // Lerp towards target rotations based on mouse position
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.6, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.4, 0.1);
        
        // Clamp the final X rotation to prevent looking from below (limit min angle)
        groupRef.current.rotation.x = THREE.MathUtils.clamp(groupRef.current.rotation.x, -0.1, Math.PI / 2);
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Wheel zoom
  useEffect(() => {
    const onWheel = (e) => {
      // Zoom camera
      if (camRef.current) {
        camRef.current.position.z += e.deltaY * 0.002
        camRef.current.position.z = THREE.MathUtils.clamp(camRef.current.position.z, 2, 20)
      }
      // Update draw progress (inverse delta for scroll down)
      setProgress(prev => {
        const next = prev - e.deltaY * 0.001
        return THREE.MathUtils.clamp(next, 0, 1)
      })
    }
    window.addEventListener('wheel', onWheel)
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' /* Restore pointerEvents */ }}>
      <Canvas shadows camera={{ position: [0, 2, 12], fov: 50 }} onCreated={({ camera, gl }) => { camRef.current = camera; gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[0, 10, 5]} intensity={1.2} angle={0.3} penumbra={0.5} castShadow />
        <spotLight position={[0, 10, -5]} intensity={0.6} angle={0.4} penumbra={0.5} castShadow />

        {/* Background chart group; muted until showHistory toggles on */}
        <Suspense fallback={null}>
          <group ref={groupRef} position={[0, 0, 0]}>
            <ChartFloor prices={prices} progress={progress} muted={!showHistory} showLabels={showHistory} />
          </group>
        </Suspense>

        {/* Disable OrbitControls; interaction handled manually */}
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  )
} 