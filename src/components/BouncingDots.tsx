import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export const BouncingDots: React.FC = () => {
    const animations = useRef(Array.from({ length: 5 }).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const anims = animations.map((anim, i) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 100),
                    Animated.timing(anim, {
                        toValue: -10,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            );
        });

        Animated.parallel(anims).start();
    }, [animations]);

    return (
        <View style={styles.dotsContainer}>
            {animations.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        { transform: [{ translateY: anim }] }
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#42f59e', // Green/Teal accent
    },
});
