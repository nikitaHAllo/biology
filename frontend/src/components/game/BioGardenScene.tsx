import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Plant3D } from './Plant3D';
import type { PlantSlot } from '../../models/biogarden';

// Позиции горшков: 2 ряда по 4 (8 всего)
const PLANT_POSITIONS: [number, number, number][] = [
	[-3.6, 0, -1.65],
	[-1.2, 0, -1.65],
	[1.2, 0, -1.65],
	[3.6, 0, -1.65],
	[-3.6, 0, 1.65],
	[-1.2, 0, 1.65],
	[1.2, 0, 1.65],
	[3.6, 0, 1.65],
];

// Грядки-короба
const PlanterBed = ({ z }: { z: number }) => (
	<group position={[0, 0, z]}>
		<mesh position={[0, -0.46, 0.66]} castShadow receiveShadow>
			<boxGeometry args={[8.6, 0.26, 0.07]} />
			<meshStandardMaterial color='#8b5e3c' roughness={0.85} />
		</mesh>
		<mesh position={[0, -0.46, -0.66]} castShadow receiveShadow>
			<boxGeometry args={[8.6, 0.26, 0.07]} />
			<meshStandardMaterial color='#8b5e3c' roughness={0.85} />
		</mesh>
		<mesh position={[4.3, -0.46, 0]} castShadow receiveShadow>
			<boxGeometry args={[0.07, 0.26, 1.32]} />
			<meshStandardMaterial color='#8b5e3c' roughness={0.85} />
		</mesh>
		<mesh position={[-4.3, -0.46, 0]} castShadow receiveShadow>
			<boxGeometry args={[0.07, 0.26, 1.32]} />
			<meshStandardMaterial color='#8b5e3c' roughness={0.85} />
		</mesh>
		{/* Земля внутри короба */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.585, 0]} receiveShadow>
			<planeGeometry args={[8.5, 1.22]} />
			<meshStandardMaterial color='#2c1810' roughness={1} />
		</mesh>
	</group>
);

// Газон и дорожки
const GardenFloor = () => (
	<>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
			<planeGeometry args={[16, 12]} />
			<meshStandardMaterial color='#1a4d1a' roughness={1} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.595, 0]}>
			<planeGeometry args={[16, 0.9]} />
			<meshStandardMaterial color='#7a6848' roughness={1} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.594, 0]}>
			<planeGeometry args={[1.0, 12]} />
			<meshStandardMaterial color='#8b7355' roughness={1} />
		</mesh>
	</>
);

// Декоративный забор
const Fence = () => {
	const posts = [-5.5, -4.0, -2.5, -1.0, 1.0, 2.5, 4.0, 5.5];
	return (
		<group>
			{posts.map((x, i) => (
				<group key={i}>
					<mesh position={[x, -0.28, -5.2]} castShadow>
						<boxGeometry args={[0.1, 0.65, 0.1]} />
						<meshStandardMaterial color='#a07850' roughness={0.9} />
					</mesh>
					{i < posts.length - 1 && (
						<mesh position={[(x + posts[i + 1]!) / 2, -0.18, -5.2]}>
							<boxGeometry args={[posts[i + 1]! - x, 0.07, 0.06]} />
							<meshStandardMaterial color='#a07850' roughness={0.9} />
						</mesh>
					)}
				</group>
			))}
		</group>
	);
};

// Пустой горшок (без растения)
interface EmptyPot3DProps {
	position: [number, number, number];
	slotIndex: number;
	isSelected: boolean;
	onClick: (slotIndex: number) => void;
}

const EmptyPot3D = ({ position, slotIndex, isSelected, onClick }: EmptyPot3DProps) => {
	const groupRef = useRef<THREE.Group>(null);
	const [hovered, setHovered] = useState(false);

	useFrame(state => {
		if (!groupRef.current) return;
		const t = state.clock.elapsedTime;
		groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + slotIndex * 1.2) * 0.02;
	});

	const potColor = hovered ? '#b07844' : '#8b6040';

	return (
		<group
			ref={groupRef}
			position={position}
			onClick={e => { e.stopPropagation(); onClick(slotIndex); }}
			onPointerOver={e => {
				e.stopPropagation();
				setHovered(true);
				document.body.style.cursor = 'pointer';
			}}
			onPointerOut={() => {
				setHovered(false);
				document.body.style.cursor = 'default';
			}}
		>
			{/* Кольцо выделения */}
			{isSelected && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
					<ringGeometry args={[0.46, 0.58, 32]} />
					<meshBasicMaterial color='#fbbf24' transparent opacity={0.85} />
				</mesh>
			)}

			{/* Горшок */}
			<mesh position={[0, -0.31, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[0.32, 0.22, 0.46, 10]} />
				<meshStandardMaterial
					color={potColor}
					roughness={0.9}
					emissive={isSelected ? '#7c3aed' : '#000000'}
					emissiveIntensity={isSelected ? 0.15 : 0}
				/>
			</mesh>
			<mesh position={[0, -0.07, 0]}>
				<torusGeometry args={[0.33, 0.04, 6, 14]} />
				<meshStandardMaterial color={potColor} roughness={0.9} />
			</mesh>
			{/* Земля */}
			<mesh position={[0, -0.08, 0]}>
				<cylinderGeometry args={[0.29, 0.29, 0.07, 10]} />
				<meshStandardMaterial color='#3d2b1a' roughness={1} />
			</mesh>

			{/* Подпись */}
			<Html position={[0, 0.28, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
				<div
					style={{
						background: 'rgba(0,0,0,0.72)',
						borderRadius: 8,
						padding: '3px 8px',
						border: `1px solid ${hovered ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.12)'}`,
						color: hovered ? '#4ade80' : 'rgba(255,255,255,0.45)',
						fontSize: 11,
						fontWeight: 700,
						whiteSpace: 'nowrap',
						fontFamily: 'system-ui, sans-serif',
						textAlign: 'center',
						userSelect: 'none',
						transition: 'color 0.15s',
					}}
				>
					+ Посадить
				</div>
			</Html>
		</group>
	);
};

// Контроллер камеры — плавное наведение
interface CameraControllerProps {
	targetPos: [number, number, number] | null;
}

const CameraController = ({ targetPos }: CameraControllerProps) => {
	const controlsRef = useRef<any>(null);
	const smoothTarget = useRef(new THREE.Vector3(0, 0, 0));

	useFrame(() => {
		if (!controlsRef.current) return;
		const dest = targetPos ? new THREE.Vector3(targetPos[0], 0, targetPos[2]) : new THREE.Vector3(0, 0, 0);
		smoothTarget.current.lerp(dest, 0.05);
		controlsRef.current.target.copy(smoothTarget.current);
		controlsRef.current.update();
	});

	return (
		<OrbitControls
			ref={controlsRef}
			minDistance={2.8}
			maxDistance={11}
			minPolarAngle={0.22}
			maxPolarAngle={Math.PI / 2.05}
			enablePan={false}
			enableDamping
			dampingFactor={0.07}
		/>
	);
};

interface BioGardenSceneProps {
	slots: PlantSlot[];
	selectedSlotIndex: number | null;
	onSlotClick: (slotIndex: number) => void;
	onDeselect: () => void;
}

export const BioGardenScene = ({
	slots,
	selectedSlotIndex,
	onSlotClick,
	onDeselect,
}: BioGardenSceneProps) => {
	const selectedPosition = selectedSlotIndex != null ? PLANT_POSITIONS[selectedSlotIndex] ?? null : null;

	return (
		<Canvas
			camera={{ position: [0, 4.8, 7.5], fov: 48 }}
			shadows
			style={{
				background: 'linear-gradient(to bottom, #080d1a 0%, #142238 55%, #0b1a0b 100%)',
			}}
			onPointerMissed={onDeselect}
		>
			<Suspense fallback={null}>
				{/* Освещение */}
				<ambientLight intensity={0.5} color='#c8d8f0' />
				<directionalLight
					position={[6, 10, 5]}
					intensity={1.2}
					castShadow
					color='#fffadc'
					shadow-mapSize={[2048, 2048]}
					shadow-camera-left={-9}
					shadow-camera-right={9}
					shadow-camera-top={8}
					shadow-camera-bottom={-8}
				/>
				<pointLight position={[0, 3.5, 0]} intensity={0.5} color='#22d3ee' />
				<pointLight position={[-3.5, 2, 0]} intensity={0.25} color='#4ade80' />
				<pointLight position={[3.5, 2, 0]} intensity={0.25} color='#84cc16' />

				<Stars radius={65} depth={45} count={2500} factor={3} saturation={0.4} fade speed={0.4} />

				<GardenFloor />
				<PlanterBed z={-1.65} />
				<PlanterBed z={1.65} />
				<Fence />

				{/* 8 слотов: занятые → Plant3D, пустые → EmptyPot3D */}
				{Array.from({ length: 8 }, (_, i) => {
					const slot = slots[i];
					const position = PLANT_POSITIONS[i] ?? [0, 0, 0];
					const isSelected = selectedSlotIndex === i;

					if (slot?.plant) {
						return (
							<Plant3D
								key={slot.plant.id}
								plant={slot.plant}
								position={position}
								isSelected={isSelected}
								onSelect={() => onSlotClick(i)}
								onHover={() => {}}
								onHoverEnd={() => {}}
							/>
						);
					}
					return (
						<EmptyPot3D
							key={`empty-${i}`}
							position={position}
							slotIndex={i}
							isSelected={isSelected}
							onClick={onSlotClick}
						/>
					);
				})}

				<fog attach='fog' args={['#080d1a', 11, 24]} />
				<CameraController targetPos={selectedPosition} />
			</Suspense>
		</Canvas>
	);
};
