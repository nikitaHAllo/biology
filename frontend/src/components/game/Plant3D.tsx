import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { BioGardenPlant } from '../../models/biogarden';

interface Plant3DProps {
	plant: BioGardenPlant;
	position: [number, number, number];
	isSelected: boolean;
	onSelect: (plant: BioGardenPlant) => void;
	onHover: (plant: BioGardenPlant) => void;
	onHoverEnd: () => void;
}

// Цветовая палитра для каждого растения
const PLANT_PALETTE: Record<number, { leaf: string; flower: string; stem: string }> = {
	1: { leaf: '#4ade80', flower: '#bbf7d0', stem: '#16a34a' }, // Горох — мятный зелёный
	2: { leaf: '#a3e635', flower: '#fde047', stem: '#65a30d' }, // Кукуруза — лайм/жёлтый
	3: { leaf: '#22d3ee', flower: '#a5f3fc', stem: '#0891b2' }, // Хламидомонада — циан
	4: { leaf: '#166534', flower: '#4ade80', stem: '#14532d' }, // Папоротник — тёмно-зелёный
	5: { leaf: '#84cc16', flower: '#d9f99d', stem: '#4d7c0f' }, // Эвглена — лаймовый
	6: { leaf: '#4ade80', flower: '#a78bfa', stem: '#15803d' }, // Картофель — зелёный/фиолет
};

export const Plant3D = ({
	plant,
	position,
	isSelected,
	onSelect,
	onHover,
	onHoverEnd,
}: Plant3DProps) => {
	const groupRef = useRef<Group>(null);
	const [hovered, setHovered] = useState(false);

	const palette = PLANT_PALETTE[plant.id] ?? PLANT_PALETTE[1];
	const stageRatio = plant.growth_stages > 0 ? plant.current_stage / plant.growth_stages : 0;
	const healthRatio =
		plant.max_health_points > 0 ? plant.health_points / plant.max_health_points : 1;

	const stemHeight = 0.15 + stageRatio * 1.4;
	const leafScale = 0.07 + stageRatio * 0.3;

	// Мягкое покачивание + вращение при выборе
	useFrame(state => {
		if (!groupRef.current) return;
		const t = state.clock.elapsedTime;
		groupRef.current.position.y = position[1] + Math.sin(t * 0.7 + plant.id * 1.5) * 0.025;
		groupRef.current.rotation.y = isSelected ? t * 0.4 : 0;
	});

	const potColor = hovered ? '#d97706' : '#c2673c';

	return (
		<group
			ref={groupRef}
			position={position}
			onClick={e => {
				e.stopPropagation();
				onSelect(plant);
			}}
			onPointerOver={e => {
				e.stopPropagation();
				setHovered(true);
				onHover(plant);
				document.body.style.cursor = 'pointer';
			}}
			onPointerOut={() => {
				setHovered(false);
				onHoverEnd();
				document.body.style.cursor = 'default';
			}}
		>
			{/* Кольцо выделения на земле */}
			{isSelected && (
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
					<ringGeometry args={[0.46, 0.58, 32]} />
					<meshBasicMaterial color='#fbbf24' transparent opacity={0.85} />
				</mesh>
			)}

			{/* Тело горшка */}
			<mesh position={[0, -0.31, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[0.32, 0.22, 0.46, 10]} />
				<meshStandardMaterial
					color={potColor}
					roughness={0.9}
					emissive={isSelected ? '#7c3aed' : '#000000'}
					emissiveIntensity={isSelected ? 0.18 : 0}
				/>
			</mesh>

			{/* Ободок горшка */}
			<mesh position={[0, -0.07, 0]}>
				<torusGeometry args={[0.33, 0.04, 6, 14]} />
				<meshStandardMaterial color={potColor} roughness={0.9} />
			</mesh>

			{/* Земля */}
			<mesh position={[0, -0.08, 0]}>
				<cylinderGeometry args={[0.29, 0.29, 0.07, 10]} />
				<meshStandardMaterial color='#3d2b1a' roughness={1} />
			</mesh>

			{/* Растение — только если разблокировано и есть стадии */}
			{plant.is_unlocked && plant.current_stage > 0 && (
				<>
					{/* Стебель */}
					<mesh position={[0, stemHeight / 2 - 0.04, 0]} castShadow>
						<cylinderGeometry args={[0.035, 0.045, stemHeight, 6]} />
						<meshStandardMaterial color={palette.stem} roughness={0.7} />
					</mesh>

					{/* Лист 1 */}
					{stageRatio >= 0.2 && (
						<mesh position={[leafScale * 1.3, stemHeight * 0.35, 0]} castShadow>
							<sphereGeometry args={[leafScale * 0.85, 7, 7]} />
							<meshStandardMaterial
								color={palette.leaf}
								roughness={0.8}
								emissive={plant.id === 3 ? palette.leaf : '#000000'}
								emissiveIntensity={plant.id === 3 ? 0.4 : 0}
							/>
						</mesh>
					)}

					{/* Лист 2 */}
					{stageRatio >= 0.4 && (
						<mesh position={[-leafScale * 1.1, stemHeight * 0.52, leafScale * 0.6]} castShadow>
							<sphereGeometry args={[leafScale, 7, 7]} />
							<meshStandardMaterial color={palette.leaf} roughness={0.8} />
						</mesh>
					)}

					{/* Листья 3–4 на высоких стадиях */}
					{stageRatio >= 0.6 && (
						<>
							<mesh position={[leafScale * 0.9, stemHeight * 0.68, -leafScale * 0.7]} castShadow>
								<sphereGeometry args={[leafScale * 1.1, 7, 7]} />
								<meshStandardMaterial color={palette.leaf} roughness={0.8} />
							</mesh>
							<mesh position={[-leafScale * 1.0, stemHeight * 0.78, 0]} castShadow>
								<sphereGeometry args={[leafScale * 0.9, 7, 7]} />
								<meshStandardMaterial color={palette.leaf} roughness={0.8} />
							</mesh>
						</>
					)}

					{/* Цветок/верхушка на высоких стадиях */}
					{stageRatio >= 0.8 && (
						<mesh position={[0, stemHeight + leafScale * 0.9, 0]} castShadow>
							<sphereGeometry args={[leafScale * 1.25, 8, 8]} />
							<meshStandardMaterial
								color={palette.flower}
								roughness={0.35}
								emissive={palette.flower}
								emissiveIntensity={0.3}
							/>
						</mesh>
					)}

					{/* Золотая звезда за завершение */}
					{plant.is_completed && (
						<mesh position={[0, stemHeight + leafScale * 2.6, 0]}>
							<octahedronGeometry args={[0.12, 0]} />
							<meshStandardMaterial
								color='#fbbf24'
								emissive='#fbbf24'
								emissiveIntensity={1.2}
								metalness={0.8}
								roughness={0.1}
							/>
						</mesh>
					)}
				</>
			)}

			{/* Заглушка для незапущенного растения */}
			{!plant.is_unlocked && (
				<mesh position={[0, 0.08, 0]}>
					<sphereGeometry args={[0.1, 6, 6]} />
					<meshStandardMaterial color='#6b7280' roughness={1} transparent opacity={0.35} />
				</mesh>
			)}

			{/* Название растения сверху */}
			<Html
				position={[0, stemHeight + leafScale * 2.0 + 0.55, 0]}
				center
				zIndexRange={[1, 0]}
				style={{ pointerEvents: 'none' }}
			>
				<div
					style={{
						background: 'rgba(0,0,0,0.72)',
						borderRadius: 8,
						padding: '4px 9px',
						border: '1px solid rgba(255,255,255,0.16)',
						color: 'rgba(255,255,255,0.95)',
						fontSize: 11,
						fontWeight: 600,
						whiteSpace: 'nowrap',
						fontFamily: 'system-ui, sans-serif',
						textAlign: 'center',
						userSelect: 'none',
					}}
				>
					{plant.name}
				</div>
			</Html>

		</group>
	);
};
