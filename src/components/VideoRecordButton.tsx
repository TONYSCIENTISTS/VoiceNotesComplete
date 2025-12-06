import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Determine the asset source. 
// Note: In a real app, ensure the path layout is correct. 
// We are assuming the file is at ../../assets/images/Buttonanimation.mp4 relative to src/components/
const recordAnimationVideo = require('../../assets/images/Buttonanim.mp4');

export type VideoRecordButtonProps = {
    isRecording: boolean;
    onPress: () => void;
    size?: number;
};

export const VideoRecordButton: React.FC<VideoRecordButtonProps> = ({
    isRecording,
    onPress,
    size = 100, // Slightly larger base size for a detail video
}) => {
    // We can still add a scale animation for the press/recording state
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            // Pulse effect when recording
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1.0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            // Reset
            scaleAnim.stopAnimation();
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    }, [isRecording]);

    return (
        <Pressable onPress={onPress}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <View style={styles.videoWrapper}>
                    <Video
                        source={recordAnimationVideo}
                        style={StyleSheet.absoluteFill}
                        isLooping
                        shouldPlay={true} // Always play the ambient animation
                        resizeMode={ResizeMode.CONTAIN}
                        isMuted={true}
                    />
                </View>

                {/* Icon removed to show the video animation clearly */}
                {/* <View style={styles.iconOverlay}>
                     <Ionicons 
                        name={isRecording ? "stop" : "mic"} 
                        size={size * 0.3} 
                        color="white" 
                        style={{ opacity: 0.9 }}
                     />
                </View> */}

                {/* Optional: Border ring */}
                <View style={[
                    styles.borderRing,
                    {
                        borderRadius: size / 2,
                        borderColor: isRecording ? '#ff3366' : 'rgba(255,255,255,0.3)'
                    }
                ]} />

            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // fallback
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    videoWrapper: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        borderRadius: 9999, // Ensure video is clipped to circle
    },
    iconOverlay: {
        zIndex: 10,
    },
    borderRing: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        zIndex: 20,
    }
});
