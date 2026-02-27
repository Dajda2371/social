import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
    const router = useRouter();

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
                            const API_URL = process.env.EXPO_PUBLIC_API_URL;
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatarBig} />
                    <Text style={styles.username}>User</Text>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#ff3b30" />
                    <Text style={styles.logoutText}>Log Out</Text>
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
    header: {
        padding: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    avatarBig: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#333333',
        marginBottom: 15,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
    },
    logoutText: {
        color: '#ff3b30',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
