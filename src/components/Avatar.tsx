import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import { lipsyncManager, Viseme } from '../utils/lipsyncManager';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Viseme to morph target mapping - approximations for the character models
const visemeToMorphIndex: Record<Viseme, number> = {
    'A': 0,  // Open mouth
    'E': 1,  // Medium open
    'I': 2,  // Wide/smile
    'O': 3,  // Rounded
    'U': 4,  // Narrow rounded
    'M': 5,  // Lips closed
    'F': 6,  // Lip bite
    'TH': 7, // Tongue
    'S': 8,  // Teeth
    'X': 9,  // Neutral
};

interface AvatarProps {
    character?: 'aima' | 'sara';
}

export const Avatar: React.FC<AvatarProps> = ({ character = 'aima' }) => {
    const group = useRef<any>(null);
    const headRef = useRef<any>(null);
    const [modelUri, setModelUri] = useState<string | null>(null);

    // Load the model asset
    useEffect(() => {
        const loadModel = async () => {
            try {
                const asset = character === 'sara'
                    ? Asset.fromModule(require('../../assets/models/Sara.glb'))
                    : Asset.fromModule(require('../../assets/models/6936b0da347390125d6069ae.glb'));

                await asset.downloadAsync();
                setModelUri(asset.localUri || asset.uri);
            } catch (error) {
                console.error('Error loading model:', error);
            }
        };

        loadModel();
    }, [character]);

    // Load the GLB model - only if we have a URI
    const gltf = modelUri ? useGLTF(modelUri) : null;

    // Animation loop
    useFrame((state) => {
        if (!gltf) return;

        if (!headRef.current && gltf.scene) {
            // Find the mesh with morph targets
            const findMorphMesh = (obj: any): any => {
                if (obj.morphTargetInfluences && obj.morphTargetInfluences.length > 0) {
                    return obj;
                }
                for (const child of obj.children || []) {
                    const found = findMorphMesh(child);
                    if (found) return found;
                }
                return null;
            };
            headRef.current = findMorphMesh(gltf.scene);
        }

        // Apply lipsync morphs
        if (headRef.current && headRef.current.morphTargetInfluences) {
            const currentViseme = lipsyncManager.viseme;
            const targetIndex = visemeToMorphIndex[currentViseme];

            // Smooth interpolation to new viseme
            headRef.current.morphTargetInfluences.forEach((value: number, index: number) => {
                const target = index === targetIndex ? 0.8 : 0;
                const smoothing = 0.2;
                headRef.current.morphTargetInfluences[index] =
                    value + (target - value) * smoothing;
            });
        }

        // Subtle idle animation
        if (group.current && gltf.scene) {
            group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    // While loading or if model fails, show placeholder
    if (!modelUri || !gltf) {
        return (
            <group position={[0, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshStandardMaterial color="#00D4FF" />
                </mesh>
            </group>
        );
    }

    return (
        <group ref={group} position={[0, -1.6, 0]} scale={[1, 1, 1]}>
            <primitive object={gltf.scene} />
        </group>
    );
};
