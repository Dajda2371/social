import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView, RefreshControl, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const { width } = Dimensions.get('window');

interface MediaItem {
  id: number;
  filename: string;
  content_type: string;
  uploaded_at: string;
}

export default function FeedScreen() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedia = async () => {
    try {
      const response = await axios.get(`${API_URL}/media`);
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

  const renderItem = ({ item }: { item: MediaItem }) => {
    const isVideo = item.content_type.startsWith('video');
    const mediaUrl = `${API_URL}/media/${item.id}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar} />
          <Text style={styles.username}>User</Text>
          <Text style={styles.dateText}>
            {new Date(item.uploaded_at).toLocaleDateString()}
          </Text>
        </View>

        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.mediaContent}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={false} // Prevent all videos from playing at once
          />
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.mediaContent}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

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
          <Text style={styles.subText}>Upload a video or image via the Explore tab.</Text>
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    marginRight: 10,
  },
  username: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  dateText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  mediaContent: {
    width: width,
    height: width, // Square aspect ratio container, but content scales
    backgroundColor: '#000000',
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
