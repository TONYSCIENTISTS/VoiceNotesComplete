import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type OrbRecordButtonProps = {
    isRecording: boolean;
    onPress: () => void;
    size?: number; // Diameter of the button
    currentLevel?: number; // 0 to 1, for audio reactivity
};

export const OrbRecordButton: React.FC<OrbRecordButtonProps> = ({
    isRecording,
    onPress,
    size = 180, // Default size
    currentLevel = 0,
}) => {
    // -------------------------------------------------------------
    // Animation Values
    // -------------------------------------------------------------
    const scale = useRef(new Animated.Value(1)).current;       // Pulsing size
    const spinValue = useRef(new Animated.Value(0)).current;   // Rotation (0 to 1)
    const glowOpacity = useRef(new Animated.Value(0.5)).current; // Outer glow intensity

    // Smooth out the audio level for the orb (less jittery than raw)
    const smoothLevel = useRef(new Animated.Value(0)).current;

    // Secondary animations for dynamic internal movement
    const spinValue2 = useRef(new Animated.Value(0)).current;
    const spinValue3 = useRef(new Animated.Value(0)).current;

    // -------------------------------------------------------------
    // Audio Level Smoothing
    // -------------------------------------------------------------
    useEffect(() => {
        if (isRecording) {
            Animated.timing(smoothLevel, {
                toValue: currentLevel,
                duration: 100,
                useNativeDriver: true,
                easing: Easing.linear,
            }).start();
        } else {
            Animated.timing(smoothLevel, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [currentLevel, isRecording]);

    // -------------------------------------------------------------
    // Animation Logic
    // -------------------------------------------------------------
    useEffect(() => {
        // 1. Primary Spin
        const spinLoop = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: isRecording ? 1500 : 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // 2. Secondary Spin (opposite direction, slower)
        const spinLoop2 = Animated.loop(
            Animated.timing(spinValue2, {
                toValue: 1,
                duration: isRecording ? 2500 : 12000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // 3. Tertiary Spin (different speed for complex motion)
        const spinLoop3 = Animated.loop(
            Animated.timing(spinValue3, {
                toValue: 1,
                duration: isRecording ? 3500 : 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        spinLoop.start();
        spinLoop2.start();
        spinLoop3.start();

        return () => {
            spinLoop.stop();
            spinLoop2.stop();
            spinLoop3.stop();
        };
    }, [isRecording]);

    // State Transition Animations (Pop / Shrink)
    useEffect(() => {
        if (isRecording) {
            // START RECORDING: Big Pop Up 1 -> 1.2 -> 1.0 (extra bounce)
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            ]).start();

            Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        } else {
            // STOP RECORDING: Shrink 1 -> 0.9 -> 1.0 (with elastic bounce)
            Animated.sequence([
                Animated.timing(scale, { toValue: 0.9, duration: 100, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                Animated.timing(scale, { toValue: 1.0, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            ]).start();

            Animated.timing(glowOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true }).start();
        }
    }, [isRecording]);

    // Audio Reactive Pulse (Dynamic Scale & Glow)
    // We mix the static "scale" (which handles the pop) with the audio level.
    // However, since we used `scale` for the pop, we should add the audio effect.
    // Animated.add(scale, smoothLevel.interpolate(...))

    // Scale Interpolation: Base scale + Audio Punch
    const finalScale = Animated.add(
        scale,
        smoothLevel.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15], // Add up to 15% scaling on loud sounds
        })
    );

    // Glow Interpolation: Base Glow + Audio Punch
    const finalGlow = Animated.add(
        glowOpacity,
        smoothLevel.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5], // Add opacity on loud sounds
        })
    );

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    // Animate the inner circle size (Reveal more gradient when recording)
    // SCALE transform to support Native Driver.
    const innerShrinkScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(innerShrinkScale, {
            toValue: isRecording ? 0.833 : 1, // 0.833 * 0.72 ≈ 0.60
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isRecording]);
    // -------------------------------------------------------------
    // Interpolations & Sizes
    // -------------------------------------------------------------
    const rotation = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const counterRotation = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    const rotation2 = spinValue2.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'], // Opposite direction
    });

    const rotation3 = spinValue3.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Icon size
    const iconSize = size * 0.35;

    // Static base size for the inner circle (reduced to 50% to fill more)
    const innerCircleBaseSize = size * 0.50;

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.container, { width: size + 60, height: size + 60 }]}
        >
            <View style={styles.centerParams}>

                {/* BREATHING RINGS - Subtle audio aura */}
                {isRecording && (
                    <Svg
                        height={size * 1.6}
                        width={size * 1.6}
                        style={{
                            position: 'absolute',
                            zIndex: 0,
                        }}
                    >
                        <Defs>
                            <SvgLinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.6" />
                                <Stop offset="50%" stopColor="#5E5CE6" stopOpacity="0.5" />
                                <Stop offset="100%" stopColor="#00FFFF" stopOpacity="0.4" />
                            </SvgLinearGradient>
                        </Defs>

                        {[0, 1, 2].map((i) => {
                            const baseRadius = (size * 0.55) + (i * 12);
                            const pulse = currentLevel * 8; // Subtle pulse
                            const dynamicRadius = baseRadius + pulse;
                            const opacity = 0.5 - (i * 0.12);

                            return (
                                <Circle
                                    key={i}
                                    cx="50%"
                                    cy="50%"
                                    r={dynamicRadius}
                                    stroke="url(#ringGradient)"
                                    strokeWidth={2}
                                    strokeOpacity={opacity}
                                    fill="none"
                                />
                            );
                        })}
                    </Svg>
                )}

                {/* 0. SECONDARY GLOW (Pink/Purple) - Matches the gradient tail */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        width: size, // Match size to hide solid part
                        height: size,
                        borderRadius: size / 2,
                        opacity: finalGlow,
                        transform: [
                            { scale: finalScale },
                            { rotate: counterRotation } // Spins opposite way!
                        ],
                        backgroundColor: '#5E5CE6', // Purple from gradient
                        shadowColor: "#5E5CE6",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1.0,
                        shadowRadius: 80,
                        zIndex: 0,
                    }}
                    pointerEvents="none"
                />


                {/* 1. PRIMARY GLOW (Electric Cyan) */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        opacity: finalGlow,
                        transform: [{ scale: finalScale }], // Pulse with audio!
                        backgroundColor: '#00FFFF',
                        shadowColor: "#00FFFF",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 60,
                        zIndex: 1,
                    }}
                    pointerEvents="none"
                />

                {/* 2. MAIN ORB - Multiple Dynamic Gradient Layers */}
                <Animated.View
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: finalScale }],
                        overflow: 'hidden',
                        zIndex: 2,
                        borderWidth: isRecording ? 2 : 0,
                        borderColor: isRecording ? 'rgba(0,212,255,0.6)' : 'transparent',
                        // Glass effect shadows
                        shadowColor: '#00D4FF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.7,
                        shadowRadius: 30,
                    }}
                >
                    {/* Layer 1: Base rotating gradient */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            transform: [{ rotate: rotation }],
                        }}
                    >
                        <LinearGradient
                            colors={['#001F3F', '#00D4FF', '#5E5CE6', '#00FFFF', '#001F3F']}
                            start={{ x: 0.0, y: 0.0 }}
                            end={{ x: 1.0, y: 1.0 }}
                            locations={[0, 0.25, 0.5, 0.75, 1]}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>

                    {/* Layer 2: Secondary gradient (opposite rotation) */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            opacity: 0.6,
                            transform: [{ rotate: rotation2 }],
                        }}
                    >
                        <LinearGradient
                            colors={['transparent', '#00FFFF', 'transparent', '#5E5CE6', 'transparent']}
                            start={{ x: 0.0, y: 1.0 }}
                            end={{ x: 1.0, y: 0.0 }}
                            locations={[0, 0.3, 0.5, 0.7, 1]}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>

                    {/* Layer 3: Tertiary gradient (different angle) */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            opacity: 0.5,
                            transform: [{ rotate: rotation3 }],
                        }}
                    >
                        <LinearGradient
                            colors={['#00D4FF', 'transparent', '#5E5CE6', 'transparent', '#00D4FF']}
                            start={{ x: 0.5, y: 0.0 }}
                            end={{ x: 0.5, y: 1.0 }}
                            locations={[0, 0.25, 0.5, 0.75, 1]}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                </Animated.View>

                {/* Outline Ring */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        width: size + 4,
                        height: size + 4,
                        borderRadius: (size + 4) / 2,
                        borderWidth: 2,
                        borderColor: 'rgba(0,212,255,0.5)',
                        transform: [{ scale: finalScale }],
                        zIndex: 3,
                    }}
                    pointerEvents="none"
                />

                {/* Glass Highlight Overlay */}
                <View
                    style={{
                        position: 'absolute',
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        overflow: 'hidden',
                        zIndex: 3,
                    }}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.5 }}
                        style={{
                            width: '100%',
                            height: '50%',
                        }}
                    />
                </View>

                {/* 3. ICON (on top of filled orb) */}
                <View style={styles.iconOverlay} pointerEvents="none">
                    <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={iconSize}
                        color={isRecording ? "#ff3366" : "rgba(255,255,255,0.9)"}
                    />
                </View>

            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerParams: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});

export default OrbRecordButton;
