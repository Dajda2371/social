import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Comment {
    id: number;
    content: string;
    username: string;
    parent_id: number | null;
    created_at: string;
}

interface FlatComment extends Comment {
    depth: number;
}

export default function CommentsScreen() {
    const { mediaId } = useLocalSearchParams<{ mediaId: string }>();
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const [inputText, setInputText] = useState('');
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const refreshComments = React.useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/media/${mediaId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Fetch comments error:', error);
        } finally {
            setLoading(false);
        }
    }, [mediaId]);

    useEffect(() => {
        refreshComments();
    }, [refreshComments]);

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            Alert.alert('Error', 'You must be logged in to comment.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                content: inputText.trim(),
                parent_id: replyingTo ? replyingTo.id : null,
            };

            await axios.post(`${API_URL}/media/${mediaId}/comment`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setInputText('');
            setReplyingTo(null);
            refreshComments(); // Refresh list to get new comment
        } catch (error) {
            console.error('Submit comment error:', error);
            Alert.alert('Error', 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    // Flatten the comments into a tree
    const flattenComments = (allComments: Comment[], parentId: number | null = null, depth = 0): FlatComment[] => {
        const list: FlatComment[] = [];
        // Sort oldest first for natural conversation flow
        const children = allComments
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        for (const child of children) {
            list.push({ ...child, depth });
            list.push(...flattenComments(allComments, child.id, depth + 1));
        }
        return list;
    };

    const flatList = flattenComments(comments);

    const renderComment = ({ item }: { item: FlatComment }) => {
        const initial = item.username ? item.username[0].toUpperCase() : '?';

        return (
            <View style={[styles.commentContainer, { paddingLeft: 15 + item.depth * 25 }]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => setReplyingTo(item)}
                    >
                        <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
                <View style={styles.backButton} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0a84ff" />
                </View>
            ) : flatList.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No comments yet.</Text>
                    <Text style={styles.emptySubText}>Be the first to comment!</Text>
                </View>
            ) : (
                <FlatList
                    data={flatList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderComment}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputSection}>
                    {replyingTo && (
                        <View style={styles.replyingToHeader}>
                            <Text style={styles.replyingToText}>
                                Replying to <Text style={{ fontWeight: 'bold' }}>{replyingTo.username}</Text>
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <IconSymbol name="xmark.circle.fill" size={18} color="#8e8e93" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                            placeholderTextColor="#8e8e93"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!inputText.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <IconSymbol name="paperplane.fill" size={20} color={inputText.trim() ? "#0a84ff" : "#333333"} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptySubText: {
        color: '#8e8e93',
        marginTop: 5,
    },
    listContainer: {
        paddingVertical: 10,
        paddingRight: 15,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingVertical: 4,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1c1c1e',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
    },
    avatarText: {
        color: '#0a84ff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 8,
    },
    dateText: {
        color: '#8e8e93',
        fontSize: 12,
    },
    commentText: {
        color: '#e5e5ea',
        fontSize: 15,
        lineHeight: 20,
    },
    replyButton: {
        marginTop: 6,
        paddingVertical: 2,
    },
    replyButtonText: {
        color: '#8e8e93',
        fontSize: 13,
        fontWeight: '600',
    },
    inputSection: {
        borderTopWidth: 0.5,
        borderTopColor: '#333333',
        backgroundColor: '#111111',
        padding: 10,
    },
    replyingToHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
        marginBottom: 8,
    },
    replyingToText: {
        color: '#8e8e93',
        fontSize: 13,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#222222',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        maxHeight: 100,
        minHeight: 24,
        paddingTop: 4,
    },
    sendButton: {
        marginLeft: 10,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
