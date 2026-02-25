import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Change this to your computer's local IP address if testing on a physical device
const API_URL = Platform.OS === 'ios' ? 'http://localhost:8000/api' : 'http://10.0.2.2:8000/api';

export default function UploadScreen() {
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickMedia = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  const uploadMedia = async () => {
    if (!media) return;

    setIsUploading(true);

    // Create form data
    const formData = new FormData();
    const uriParts = media.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // Determine mime type based on media type provided by image picker
    let mimeType = '';
    if (media.type === 'video') {
      mimeType = `video/${fileType}`;
    } else {
      mimeType = `image/${fileType}`;
    }

    formData.append('file', {
      uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
      name: `upload.${fileType}`,
      type: mimeType,
    } as any);

    try {
      // Use local IP for API URL if running on a physical device, 'localhost' works for iOS Simulator
      // Use '10.0.2.2' for Android Emulator
      // Hardcode computer's local network IP if testing on real device
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload success:', response.data);
      Alert.alert('Success', 'Media uploaded successfully!');
      setMedia(null); // Reset after upload
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload media. Ensure backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upload Media</Text>

      <View style={styles.contentContainer}>
        {media ? (
          <View style={styles.previewContainer}>
            {media.type === 'video' ? (
              <Video
                source={{ uri: media.uri }}
                style={styles.preview}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            ) : (
              <Image
                source={{ uri: media.uri }}
                style={styles.preview}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setMedia(null)}
              disabled={isUploading}
            >
              <IconSymbol name="xmark.circle.fill" size={30} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pickerContainer} onPress={pickMedia}>
            <IconSymbol name="photo.fill" size={60} color="#8e8e93" />
            <Text style={styles.pickerText}>Tap to select an image or video</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.uploadButton, (!media || isUploading) && styles.uploadButtonDisabled]}
          onPress={uploadMedia}
          disabled={!media || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <IconSymbol name="arrow.up.circle.fill" size={24} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload to Feed</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    borderRadius: 20,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  pickerText: {
    color: '#8e8e93',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111111',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  uploadButton: {
    backgroundColor: '#0a84ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#333333',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
