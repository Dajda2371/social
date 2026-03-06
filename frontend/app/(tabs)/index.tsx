import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const { width: screenWidth } = Dimensions.get('window');

interface MediaItem {
  id: number;
  filename: string;
  content_type: string;
  uploaded_at: string;
  user_id: number | null;
  username: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

// Simple JWT decode (base64) - no verification needed client-side
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

// Sub-component for each feed item so it can manage its own aspect ratio state
function FeedItem({
  item,
  currentUsername,
  onDelete,
  onLike,
  onComments,
  onUserPress,
}: {
  item: MediaItem;
  currentUsername: string | null;
  onDelete: (id: number) => void;
  onLike: (id: number) => void;
  onComments: (id: number) => void;
  onUserPress: (username: string) => void;
}) {
  const [mediaHeight, setMediaHeight] = useState(screenWidth * (9 / 16)); // Default 16:9

  const isVideo = item.content_type.startsWith('video');
  const mediaUrl = `${API_URL}/media/${item.id}`;
  const isOwner = currentUsername && item.username === currentUsername;
  const displayName = item.username || 'Unknown';
  const initial = displayName[0]?.toUpperCase() || '?';

  const handleImageLoad = (event: any) => {
    // In React Native Web, event.nativeEvent.source might be undefined.
    // The width/height might be directly on event.nativeEvent or on the target itself.
    let imgWidth = event.nativeEvent?.source?.width || event.nativeEvent?.width || event.target?.naturalWidth || event.currentTarget?.naturalWidth;
    let imgHeight = event.nativeEvent?.source?.height || event.nativeEvent?.height || event.target?.naturalHeight || event.currentTarget?.naturalHeight;

    if (imgWidth && imgHeight && imgWidth > 0) {
      setMediaHeight(screenWidth * (imgHeight / imgWidth));
    }
  };

  const handleVideoReadyForDisplay = (event: any) => {
    let vidWidth = event.naturalSize?.width || event.nativeEvent?.naturalSize?.width || event.target?.videoWidth;
    let vidHeight = event.naturalSize?.height || event.nativeEvent?.naturalSize?.height || event.target?.videoHeight;

    if (vidWidth && vidHeight && vidWidth > 0) {
      setMediaHeight(screenWidth * (vidHeight / vidWidth));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => item.username && onUserPress(item.username)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.username}>{displayName}</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {new Date(item.uploaded_at).toLocaleDateString()}
        </Text>
        {isOwner && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(item.id)}
          >
            <IconSymbol name="trash.fill" size={18} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>

      {isVideo ? (
        <Video
          source={{ uri: mediaUrl }}
          style={[styles.mediaContent, { height: mediaHeight }]}
          videoStyle={{ width: '100%', height: '100%' }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay={false}
          onReadyForDisplay={handleVideoReadyForDisplay}
        />
      ) : (
        <Image
          source={{ uri: mediaUrl }}
          style={[styles.mediaContent, { height: mediaHeight }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
      )}

      {/* Footer Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item.id)}>
            <IconSymbol
              name={item.is_liked ? "heart.fill" : "heart"}
              size={26}
              color={item.is_liked ? "#ff3b30" : "#ffffff"}
            />
            <Text style={styles.actionText}>{item.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onComments(item.id)}>
            <IconSymbol name="bubble.right" size={24} color="#ffffff" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const router = useRouter();

  const loadCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded?.sub) {
          setCurrentUsername(decoded.sub);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const fetchMedia = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/media`, { headers });
      // Reverse array so newest items show first
      setMediaList(response.data.reverse());
    } catch (error) {
      console.error('Fetch media error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    fetchMedia();
  }, []);

  // Refresh feed whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMedia();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedia();
  };

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
              // Remove from local state
              setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleLike = async (mediaId: number) => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Error', 'You must be logged in to like posts.');
      return;
    }

    // Optimistically update UI
    setMediaList((prev) =>
      prev.map((m) => {
        if (m.id === mediaId) {
          return {
            ...m,
            is_liked: !m.is_liked,
            likes_count: m.is_liked ? m.likes_count - 1 : m.likes_count + 1,
          };
        }
        return m;
      })
    );

    try {
      const response = await axios.post(
        `${API_URL}/media/${mediaId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Sync exact counts if needed
      setMediaList((prev) =>
        prev.map((m) =>
          m.id === mediaId
            ? { ...m, likes_count: response.data.likes_count, is_liked: response.data.liked }
            : m
        )
      );
    } catch (error) {
      console.error('Like error:', error);
      // Revert optimism if failed
      fetchMedia();
    }
  };

  const openComments = (mediaId: number) => {
    router.push({ pathname: '/comments' as any, params: { mediaId } });
  };

  const handleUserPress = (username: string) => {
    router.push({ pathname: '/user-profile' as any, params: { username } });
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <FeedItem
      item={item}
      currentUsername={currentUsername}
      onDelete={handleDelete}
      onLike={handleLike}
      onComments={openComments}
      onUserPress={handleUserPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Social Feed</Text>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : mediaList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet.</Text>
          <Text style={styles.subText}>Upload a video or image via the Upload tab.</Text>
        </View>
      ) : (
        <FlatList
          data={mediaList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
          }
          contentContainerStyle={styles.listContainer}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#111111',
    marginVertical: 10,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  avatarText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  dateText: {
    color: '#8e8e93',
    fontSize: 12,
    marginRight: 8,
  },
  deleteButton: {
    padding: 6,
  },
  mediaContent: {
    width: screenWidth,
    backgroundColor: '#000000',
  },
  cardFooter: {
    padding: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: '#8e8e93',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});

