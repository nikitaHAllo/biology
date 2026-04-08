import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Plant3D } from './Plant3D';
import type { BioGardenPlant } from '../../models/biogarden';

// Позиции горшков: 2 ряда по 4 растения (8 всего)
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
		{/* Центральная дорожка между рядами */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.595, 0]}>
			<planeGeometry args={[16, 0.9]} />
			<meshStandardMaterial color='#7a6848' roughness={1} />
		</mesh>
		{/* Поперечная дорожка */}
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
						<mesh position={[(x + posts[i + 1]) / 2, -0.18, -5.2]}>
							<boxGeometry args={[posts[i + 1] - x, 0.07, 0.06]} />
							<meshStandardMaterial color='#a07850' roughness={0.9} />
						</mesh>
					)}
				</group>
			))}
		</group>
	);
};

// Контроллер камеры — плавное наведение на выбранное растение
interface CameraControllerProps {
	targetPos: [number, number, number] | null;
}

const CameraController = ({ targetPos }: CameraControllerProps) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	plants: BioGardenPlant[];
	selectedPlantId: number | null;
	onPlantSelect: (plant: BioGardenPlant) => void;
	onPlantHover: (plant: BioGardenPlant) => void;
	onPlantHoverEnd: () => void;
	onDeselect: () => void;
}

export const BioGardenScene = ({
	plants,
	selectedPlantId,
	onPlantSelect,
	onPlantHover,
	onPlantHoverEnd,
	onDeselect,
}: BioGardenSceneProps) => {
	const selectedIdx = plants.findIndex(p => p.id === selectedPlantId);
	const selectedPosition = selectedIdx >= 0 ? PLANT_POSITIONS[selectedIdx] ?? null : null;

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

				{/* Звёзды */}
				<Stars radius={65} depth={45} count={2500} factor={3} saturation={0.4} fade speed={0.4} />

				{/* Пол и декор */}
				<GardenFloor />
				<PlanterBed z={-1.65} />
				<PlanterBed z={1.65} />
				<Fence />

				{/* Растения */}
				{plants.slice(0, 8).map((plant, index) => (
					<Plant3D
						key={plant.id}
						plant={plant}
						position={PLANT_POSITIONS[index] ?? [0, 0, 0]}
						isSelected={selectedPlantId === plant.id}
						onSelect={onPlantSelect}
						onHover={onPlantHover}
						onHoverEnd={onPlantHoverEnd}
					/>
				))}

				{/* Туман для глубины */}
				<fog attach='fog' args={['#080d1a', 11, 24]} />

				{/* Управление камерой */}
				<CameraController targetPos={selectedPosition} />
			</Suspense>
		</Canvas>
	);
};
