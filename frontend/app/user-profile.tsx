import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

interface MediaItem {
    id: number;
    filename: string;
    content_type: string;
    uploaded_at: string;
}

export default function UserProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const router = useRouter();
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mediaCount, setMediaCount] = useState(0);

    useEffect(() => {
        const fetchUserMedia = async () => {
            try {
                const response = await axios.get(`${API_URL}/user/${username}/media`);
                const media = response.data.media.reverse();
                setMediaList(media);
                setMediaCount(media.length);
            } catch (error) {
                console.error('Fetch user media error:', error);
            } finally {
                setLoading(false);
            }
        };
        if (username) fetchUserMedia();
    }, [username]);

    const renderGridItem = ({ item }: { item: MediaItem }) => {
        const isVideo = item.content_type.startsWith('video');
        const mediaUrl = `${API_URL}/media/${item.id}`;

        return (
            <View style={styles.gridItem}>
                {isVideo ? (
                    <Video
                        source={{ uri: mediaUrl }}
                        style={styles.gridMedia}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                    />
                ) : (
                    <Image
                        source={{ uri: mediaUrl }}
                        style={styles.gridMedia}
                        resizeMode="cover"
                    />
                )}
                {isVideo && (
                    <View style={styles.videoIndicator}>
                        <Text style={styles.videoIndicatorText}>▶</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{username}</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.profileSection}>
                <View style={styles.avatarBig}>
                    <Text style={styles.avatarText}>
                        {username ? username[0].toUpperCase() : '?'}
                    </Text>
                </View>
                <Text style={styles.username}>{username}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mediaCount}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0a84ff" />
                </View>
            ) : mediaList.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={mediaList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderGridItem}
                    numColumns={3}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333333',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 25,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333333',
    },
    avatarBig: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#1c1c1e',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333333',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0a84ff',
    },
    username: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statLabel: {
        fontSize: 13,
        color: '#8e8e93',
        marginTop: 2,
    },
    gridContainer: {
        paddingTop: 2,
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        borderWidth: 0.5,
        borderColor: '#000000',
        position: 'relative',
    },
    gridMedia: {
        width: '100%',
        height: '100%',
    },
    videoIndicator: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    videoIndicatorText: {
        color: '#ffffff',
        fontSize: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#8e8e93',
        fontSize: 18,
    },
});
