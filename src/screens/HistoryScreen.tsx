import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import { VoiceNote, TranscriptStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { HapticFeedback } from '../utils/haptics';

type RootStackParamList = {
    List: undefined;
    Detail: { noteId: string };
    History: undefined;
};

type Nav = StackNavigationProp<RootStackParamList, 'History'>;

type FilterType = 'all' | 'done' | 'pending' | 'error';

function formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export const HistoryScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { notes, queuedCount, retryTranscription, deleteNote, processTranscriptionQueue } = useVoiceNotes();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Debounce search query (500ms)
    useEffect(() => {
        if (searchQuery !== debouncedQuery) {
            setIsSearching(true);
        }

        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Process any pending transcriptions
        await processTranscriptionQueue();
        // Small delay for UX
        setTimeout(() => setRefreshing(false), 500);
    }, [processTranscriptionQueue]);

    const filteredNotes = useMemo(() => {
        let filtered = notes;

        // Filter by status
        if (filter !== 'all') {
            filtered = filtered.filter(n => n.transcriptStatus === filter);
        }

        // Filter by search query (use debounced version)
        const q = debouncedQuery.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(n =>
                (n.transcript ?? '').toLowerCase().includes(q) ||
                (n.aiSummary ?? '').toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [notes, debouncedQuery, filter]);

    const getStatusConfig = (status: string, retryCount?: number) => {
        switch (status) {
            case 'done':
                return { color: '#42f59e', icon: 'checkmark-circle', label: 'Done' };
            case 'pending':
                return { color: '#00D4FF', icon: 'time', label: 'Transcribing' };
            case 'error':
                return {
                    color: '#ff3366',
                    icon: 'alert-circle',
                    label: retryCount ? `Error (Retry ${retryCount}/3)` : 'Error'
                };
            default:
                return { color: '#888', icon: 'help-circle', label: 'Unknown' };
        }
    };

    const handleDelete = (item: VoiceNote) => {
        Alert.alert(
            'Delete Voice Note',
            'Are you sure you want to delete this recording?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteNote(item.id),
                },
            ]
        );
    };

    const renderRightActions = (item: VoiceNote) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => {
                HapticFeedback.warning();
                handleDelete(item);
            }}
        >
            <Ionicons name="trash" size={24} color="white" />
            <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item, index }: { item: VoiceNote; index: number }) => {
        const statusConfig = getStatusConfig(item.transcriptStatus, item.retryCount);
        const hasAI = !!item.aiSummary;

        return (
            <Swipeable
                renderRightActions={() => renderRightActions(item)}
                overshootRight={false}
            >
                <View style={styles.cardWrapper}>
                    <LinearGradient
                        colors={['rgba(0, 212, 255, 0.15)', 'rgba(94, 92, 230, 0.15)', 'rgba(0, 212, 255, 0.15)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorder}
                    >
                        <TouchableOpacity
                            style={styles.noteCard}
                            onPress={() => {
                                HapticFeedback.impact();
                                navigation.navigate('Detail', { noteId: item.id });
                            }}
                            activeOpacity={0.7}
                        >
                            {/* Header Row */}
                            <View style={styles.cardHeader}>
                                <View style={styles.timeContainer}>
                                    <Ionicons name="time-outline" size={14} color="#888" />
                                    <Text style={styles.noteTime}>
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </Text>
                                </View>
                                <View style={styles.durationBadge}>
                                    <Ionicons name="mic" size={12} color="#00D4FF" />
                                    <Text style={styles.noteDuration}>{formatDuration(item.durationMs)}</Text>
                                </View>
                            </View>

                            {/* Transcript Preview */}
                            <Text style={styles.noteTranscript} numberOfLines={2}>
                                {item.transcript
                                    ? item.transcript
                                    : item.transcriptStatus === 'pending'
                                        ? 'Transcribing your voice note'
                                        : item.transcriptStatus === 'error'
                                            ? 'Transcription failed - tap to retry'
                                            : 'No transcript yet'}
                            </Text>

                            {/* AI Summary Preview */}
                            {hasAI && (
                                <View style={styles.aiPreview}>
                                    <Ionicons name="sparkles" size={12} color="#5E5CE6" />
                                    <Text style={styles.aiText} numberOfLines={1}>
                                        {item.aiSummary}
                                    </Text>
                                </View>
                            )}

                            {/* Metadata Section - REMOVED for cleaner UI */}

                            {/* Footer Row */}
                            <View style={styles.cardFooter}>
                                <View style={[styles.statusChip, { backgroundColor: `${statusConfig.color}20` }]}>
                                    <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>

                                {/* Retry Button for Errors */}
                                {item.transcriptStatus === 'error' && (
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            HapticFeedback.selection();
                                            retryTranscription(item.id);
                                        }}
                                    >
                                        <Ionicons name="refresh" size={16} color="#00D4FF" />
                                        <Text style={styles.retryText}>Retry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Swipeable>
        );
    };

    const FilterButton = ({ type, label, count }: { type: FilterType; label: string; count: number }) => {
        const isActive = filter === type;
        return (
            <TouchableOpacity
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => {
                    HapticFeedback.selection();
                    setFilter(type);
                }}
            >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {label}
                </Text>
                {count > 0 && (
                    <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                        <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                            {count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        HapticFeedback.impact();
                        navigation.goBack();
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#00D4FF" />
                </TouchableOpacity>
                <Text style={styles.title}>Voice Notes</Text>
                <View style={styles.headerRight}>
                    {queuedCount > 0 && (
                        <View style={styles.queueBadge}>
                            <Text style={styles.queueText}>{queuedCount}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{notes.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{notes.filter(n => n.transcriptStatus === 'done').length}</Text>
                    <Text style={styles.statLabel}>Done</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{notes.filter(n => n.aiSummary).length}</Text>
                    <Text style={styles.statLabel}>AI</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.search}
                    placeholder="Search transcripts or summaries..."
                    placeholderTextColor="#555"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {isSearching && (
                    <ActivityIndicator size="small" color="#00D4FF" style={styles.searchLoader} />
                )}
                {searchQuery.length > 0 && !isSearching && (
                    <TouchableOpacity onPress={() => {
                        HapticFeedback.selection();
                        setSearchQuery('');
                    }}>
                        <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterRow}>
                <FilterButton
                    type="all"
                    label="All"
                    count={notes.length}
                />
                <FilterButton
                    type="done"
                    label="Done"
                    count={notes.filter(n => n.transcriptStatus === 'done').length}
                />
                <FilterButton
                    type="pending"
                    label="Pending"
                    count={notes.filter(n => n.transcriptStatus === 'pending').length}
                />
                <FilterButton
                    type="error"
                    label="Error"
                    count={notes.filter(n => n.transcriptStatus === 'error').length}
                />
            </View>

            {/* Notes List */}
            <FlatList
                data={filteredNotes}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={filteredNotes.length === 0 ? styles.emptyList : styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00D4FF"
                        colors={['#00D4FF']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="mic-off-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>
                            {searchQuery || filter !== 'all' ? 'No matches found' : 'No voice notes yet'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Try a different search term'
                                : filter !== 'all'
                                    ? `No notes with status: ${filter}`
                                    : 'Start recording to create your first note'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    queueBadge: {
        backgroundColor: '#ff3366',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
    },
    queueText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#00D4FF',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f1015',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#1a1b25',
    },
    searchIcon: {
        marginRight: 8,
    },
    search: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    searchLoader: {
        marginRight: 8,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#0f1015',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#1a1b25',
    },
    filterButtonActive: {
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        borderColor: '#00D4FF',
    },
    filterText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#00D4FF',
    },
    filterBadge: {
        backgroundColor: '#1a1b25',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeActive: {
        backgroundColor: '#00D4FF',
    },
    filterBadgeText: {
        color: '#666',
        fontSize: 11,
        fontWeight: '700',
    },
    filterBadgeTextActive: {
        color: '#05060b',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    gradientBorder: {
        padding: 2,
        borderRadius: 16,
    },
    noteCard: {
        backgroundColor: '#0a0b0f',
        borderRadius: 14,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    noteTime: {
        color: '#888',
        fontSize: 13,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    noteDuration: {
        color: '#00D4FF',
        fontSize: 12,
        fontWeight: '600',
    },
    noteTranscript: {
        color: 'white',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    aiPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(94, 92, 230, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    aiText: {
        color: '#b8b7ff',
        fontSize: 12,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    retryText: {
        color: '#00D4FF',
        fontSize: 12,
        fontWeight: '600',
    },
    metadataSection: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    metadataLabel: {
        color: '#888',
        fontSize: 11,
        fontWeight: '600',
        minWidth: 60,
    },
    metadataValue: {
        color: '#00D4FF',
        fontSize: 10,
        fontFamily: 'monospace',
        flex: 1,
    },
    deleteAction: {
        backgroundColor: '#ff3366',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        borderRadius: 16,
        marginBottom: 12,
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    emptyList: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
    },
});
