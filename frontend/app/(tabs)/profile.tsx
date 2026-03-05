import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Video, ResizeMode } from 'expo-av';
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

function decodeJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export default function ProfileScreen() {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const decoded = decodeJWT(token);
                if (decoded?.sub) {
                    setUsername(decoded.sub);
                    // Fetch user's media
                    const response = await axios.get(`${API_URL}/user/${decoded.sub}/media`);
                    setMediaList(response.data.media.reverse());
                }
            }
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const handleDelete = async (mediaId: number) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.delete(`${API_URL}/media/${mediaId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
                        }
                    },
                },
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.post(`${API_URL}/auth/logout`);
                        } catch (error) {
                            console.error('Logout error:', error);
                        } finally {
                            await AsyncStorage.removeItem('userToken');
                            router.replace('/login' as any);
                        }
                    },
                },
            ]
        );
    };

    const renderGridItem = ({ item }: { item: MediaItem }) => {
        const isVideo = item.content_type.startsWith('video');
        const mediaUrl = `${API_URL}/media/${item.id}`;

        return (
            <TouchableOpacity style={styles.gridItem} onLongPress={() => handleDelete(item.id)}>
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
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <>
            <View style={styles.profileSection}>
                <View style={styles.avatarBig}>
                    <Text style={styles.avatarText}>
                        {username ? username[0].toUpperCase() : '?'}
                    </Text>
                </View>
                <Text style={styles.username}>{username}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mediaList.length}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ff3b30" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            {mediaList.length > 0 && (
                <Text style={styles.sectionTitle}>Your Posts</Text>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0a84ff" />
                </View>
            ) : (
                <FlatList
                    data={mediaList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderGridItem}
                    numColumns={3}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No posts yet.</Text>
                            <Text style={styles.emptySubText}>Upload your first photo or video!</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
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
        padding: 20,
        paddingBottom: 0,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 25,
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
        fontSize: 24,
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
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginHorizontal: 20,
        justifyContent: 'center',
    },
    logoutText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    sectionTitle: {
        color: '#8e8e93',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginHorizontal: 15,
        marginTop: 25,
        marginBottom: 10,
    },
    listContent: {
        paddingBottom: 20,
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
        alignItems: 'center',
        paddingTop: 30,
    },
    emptyText: {
        color: '#8e8e93',
        fontSize: 18,
        marginBottom: 5,
    },
    emptySubText: {
        color: '#555555',
        fontSize: 14,
    },
});
