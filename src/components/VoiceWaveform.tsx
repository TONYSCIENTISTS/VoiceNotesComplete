import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
    currentLevel: number; // 0..1
    height?: number;
    width?: number;
};

const LAYER_COUNT = 24;   // number of stacked lines
const POINT_COUNT = 80;   // resolution of each line
// 🔧 ADJUST THIS VALUE to change wave size! (0.1 = small, 0.5 = big)
const WAVE_AMPLITUDE_SCALE = 0.30;

const VoiceWaveform: React.FC<Props> = ({
    currentLevel,
    height = 120,
    width = SCREEN_WIDTH - 40,
}) => {
    const [paths, setPaths] = useState<string[]>([]);
    const amplitudeRef = useRef(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = () => {
            // smooth amplitude toward currentLevel
            // High sensitivity: * 1.8
            const targetAmp = Math.max(0.02, currentLevel * 1.8);
            // Fast reaction: 0.45 (was 0.15)
            amplitudeRef.current += (targetAmp - amplitudeRef.current) * 0.45;

            const centerY = height / 2;
            // height * scale determines the max visual height in pixels
            const baseMaxAmp = height * WAVE_AMPLITUDE_SCALE;

            const newPaths: string[] = [];

            for (let layer = 0; layer < LAYER_COUNT; layer++) {
                // 0 (inner) → 1 (outer)
                const t = layer / (LAYER_COUNT - 1);
                // inner lines high, outer lines low
                const layerAmp = baseMaxAmp * (1 - t * 0.8);

                let d = `M 0 ${centerY}`;

                for (let i = 0; i <= POINT_COUNT; i++) {
                    const ratio = i / POINT_COUNT;
                    const x = ratio * width;

                    // distance from center: -0.5 .. 0.5
                    const rc = ratio - 0.5;

                    // 1) Center envelope: 1 at center, 0 at edges
                    // Triangular envelope, raised to power to make center stronger
                    const centerEnv = 1 - Math.abs(2 * ratio - 1); // 0..1
                    const envelope = Math.pow(centerEnv, 1.4);     // tweak exponent for taste

                    // 2) Base lobes: big central hump + smaller side ripples
                    const mainLobe = Math.sin(rc * Math.PI * 3);     // wide central wave
                    const sideLobes = 0.55 * Math.sin(rc * Math.PI * 9); // finer detail

                    const spatial = (mainLobe + sideLobes) * envelope;

                    const y =
                        centerY +
                        spatial * amplitudeRef.current * layerAmp;

                    d += ` L ${x} ${y}`;
                }

                newPaths.push(d);
            }

            setPaths(newPaths);
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [height, width, currentLevel]);

    return (
        <View style={[styles.container, { height, width }]}>
            <Svg height={height} width={width}>
                <Defs>
                    {/* cyan center → magenta edges */}
                    <LinearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor="#00ffff" />
                        <Stop offset="50%" stopColor="#00e4ff" />
                        <Stop offset="100%" stopColor="#ff2c8d" />
                    </LinearGradient>
                </Defs>

                {/* GLOW LAYER (Thick, faint lines behind) */}
                {paths.map((d, idx) => {
                    const t = idx / (LAYER_COUNT - 1);
                    const opacity = (0.9 - t * 0.7) * 0.15; // Reduced glow opacity
                    return (
                        <Path
                            key={`glow-${idx}`}
                            d={d}
                            stroke="url(#waveGradient)"
                            strokeWidth={4} // Reduced glow width
                            strokeOpacity={opacity}
                            fill="none"
                        />
                    );
                })}

                {/* CORE LAYER (Sharp lines on top) */}
                {paths.map((d, idx) => {
                    const t = idx / (LAYER_COUNT - 1);
                    // inner lines more opaque, outer more transparent
                    const opacity = 0.9 - t * 0.7;

                    return (
                        <Path
                            key={`core-${idx}`}
                            d={d}
                            stroke="url(#waveGradient)"
                            strokeWidth={1}
                            strokeOpacity={opacity}
                            fill="none"
                        />
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
});

export default VoiceWaveform;
