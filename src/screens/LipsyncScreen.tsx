import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HapticFeedback } from '../utils/haptics';
import { WebView } from 'react-native-webview';

export const LipsyncScreen: React.FC = () => {
    const navigation = useNavigation();
    const webViewRef = useRef<WebView>(null);
    const [showDemo, setShowDemo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handlePlayDemo = () => {
        HapticFeedback.impact();
        setShowDemo(true);
        setIsLoading(true);
    };

    const goBack = () => {
        HapticFeedback.impact();
        if (showDemo) {
            setShowDemo(false);
        } else {
            navigation.goBack();
        }
    };

    // Fullscreen WebView mode
    if (showDemo) {
        return (
            <View style={styles.fullscreenContainer}>
                {/* Loading Overlay */}
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#00D4FF" />
                        <Text style={styles.loadingText}>Loading 3D Avatar</Text>
                    </View>
                )}

                {/* WebView - Scroll Disabled with Media Permissions */}
                <WebView
                    ref={webViewRef}
                    source={{ uri: 'https://appviewerv1.web.app' }}
                    // source={{ uri: 'http://192.168.1.37:5175' }}
                    style={styles.fullscreenWebview}
                    onMessage={(event) => {
                        if (event.nativeEvent.data === 'APP_READY') {
                            setIsLoading(false);
                        }
                    }}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('WebView error:', nativeEvent);
                        setIsLoading(false);
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={false}
                    scrollEnabled={false}
                    bounces={false}
                    overScrollMode="never"
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    allowFileAccess={true}
                />

                {/* Floating Back Button - Top Left */}
                <TouchableOpacity
                    style={styles.floatingBackButton}
                    onPress={goBack}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.4)']}
                        style={styles.floatingBackGradient}
                    >
                        <Ionicons name="close" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    // Normal mode with placeholder
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#00D4FF" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Ionicons name="sparkles" size={24} color="#5E5CE6" />
                    <Text style={styles.title}>Pro Mode</Text>
                </View>

                <View style={styles.placeholder} />
            </View>

            {/* Main Content - Placeholder */}
            <View style={styles.canvasContainer}>
                <LinearGradient
                    colors={['rgba(0, 212, 255, 0.1)', 'rgba(94, 92, 230, 0.1)']}
                    style={styles.gradient}
                >
                    <View style={styles.placeholderContent}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="person" size={80} color="#00D4FF" />
                            <View style={styles.sparkleContainer}>
                                <Ionicons name="sparkles" size={20} color="#5E5CE6" style={styles.sparkle1} />
                                <Ionicons name="sparkles" size={16} color="#00FFFF" style={styles.sparkle2} />
                            </View>
                        </View>

                        <Text style={styles.placeholderTitle}>3D Lipsync Avatar</Text>
                        <Text style={styles.placeholderDescription}>
                            Interactive AI character with real-time lip synchronization
                        </Text>

                        {/* Features List */}
                        <View style={styles.featuresContainer}>
                            {[
                                { icon: 'mic', text: 'Voice-driven animation' },
                                { icon: 'cube', text: '3D character rendering' },
                                { icon: 'analytics', text: 'Real-time viseme detection' },
                                { icon: 'chatbubbles', text: 'Natural mouth movements' },
                            ].map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <Ionicons name={feature.icon as any} size={18} color="#00D4FF" />
                                    <Text style={styles.featureText}>{feature.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Controls Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={handlePlayDemo}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#00D4FF', '#5E5CE6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.demoButtonGradient}
                    >
                        <Ionicons name="play-circle" size={24} color="#fff" />
                        <Text style={styles.demoButtonText}>Launch Demo</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.infoText}>
                    Powered by wawa-lipsync
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060b',
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullscreenWebview: {
        flex: 1,
    },
    floatingBackButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    floatingBackGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    placeholder: {
        width: 44,
    },
    canvasContainer: {
        flex: 1,
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#05060b',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#00D4FF',
        marginTop: 16,
        fontSize: 14,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconWrapper: {
        position: 'relative',
        marginBottom: 24,
    },
    sparkleContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
    },
    sparkle1: {
        position: 'absolute',
        top: -10,
        right: -10,
    },
    sparkle2: {
        position: 'absolute',
        top: 10,
        left: -15,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    placeholderDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    featuresContainer: {
        width: '100%',
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    featureText: {
        color: '#fff',
        fontSize: 14,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    demoButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    demoButtonGradient: {
        flex: 1,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    demoButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    infoText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
});
