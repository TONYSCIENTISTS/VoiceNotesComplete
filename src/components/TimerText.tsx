import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface TimerTextProps {
    text: string;
}

export const TimerText: React.FC<TimerTextProps> = ({ text }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.0, duration: 100, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.bounce) }),
        ]).start();
    }, [text]);

    return (
        <Animated.Text style={[styles.timerLarge, { transform: [{ scale }] }]}>
            {text}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    timerLarge: {
        color: 'white',
        fontSize: 48,
        fontWeight: '300',
        marginBottom: 40,
        fontVariant: ['tabular-nums'],
    },
});
