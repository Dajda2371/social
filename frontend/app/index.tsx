import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    router.replace('/(tabs)' as any);
                } else {
                    router.replace('/login' as any);
                }
            } catch {
                router.replace('/login' as any);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [router]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0a84ff" />
            </View>
        );
    }

    return null;
}
