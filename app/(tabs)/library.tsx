import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import { Play, Pause, Trash2, CreditCard as Edit3, Share, Search, Clock, FileAudio } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RecordingService } from '@/services/RecordingService';
import { RecordingItem } from '@/types/Recording';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function LibraryScreen() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [editingRecording, setEditingRecording] = useState<RecordingItem | null>(null);
  const [newName, setNewName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  const recordingService = new RecordingService();

  const loadRecordings = async () => {
    try {
      const loadedRecordings = await recordingService.getRecordings();
      setRecordings(loadedRecordings);
    } catch (error) {
      console.error('Failed to load recordings', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const filteredRecordings = recordings.filter(recording =>
    recording.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playRecording = async (recording: RecordingItem) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (currentlyPlaying === recording.id) {
        setCurrentlyPlaying(null);
        setSound(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setCurrentlyPlaying(recording.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentlyPlaying(null);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing recording', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const deleteRecording = async (recording: RecordingItem) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recordingService.deleteRecording(recording.id);
              loadRecordings();
              if (currentlyPlaying === recording.id && sound) {
                await sound.unloadAsync();
                setCurrentlyPlaying(null);
                setSound(null);
              }
            } catch (error) {
              console.error('Failed to delete recording', error);
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  };

  const shareRecording = async (recording: RecordingItem) => {
    try {
      await Sharing.shareAsync(recording.uri);
    } catch (error) {
      console.error('Error sharing recording', error);
      Alert.alert('Error', 'Failed to share recording');
    }
  };

  const openRenameModal = (recording: RecordingItem) => {
    setEditingRecording(recording);
    setNewName(recording.name);
    setShowRenameModal(true);
  };

  const renameRecording = async () => {
    if (editingRecording && newName.trim()) {
      try {
        await recordingService.renameRecording(editingRecording.id, newName.trim());
        setShowRenameModal(false);
        setEditingRecording(null);
        setNewName('');
        loadRecordings();
      } catch (error) {
        console.error('Failed to rename recording', error);
        Alert.alert('Error', 'Failed to rename recording');
      }
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderRecordingItem = ({ item }: { item: RecordingItem }) => (
    <View style={styles.recordingItem}>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingHeader}>
          <Text style={styles.recordingName}>{item.name}</Text>
          <Text style={styles.recordingDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.recordingMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
          </View>
          <View style={styles.metaItem}>
            <FileAudio size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatFileSize(item.size || 0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recordingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.playButton]}
          onPress={() => playRecording(item)}
        >
          {currentlyPlaying === item.id ? (
            <Pause size={20} color="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openRenameModal(item)}
        >
          <Edit3 size={18} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => shareRecording(item)}
        >
          <Share size={18} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteRecording(item)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recording Library</Text>
        <Text style={styles.subtitle}>
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recordings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {filteredRecordings.length === 0 ? (
        <View style={styles.emptyState}>
          <FileAudio size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No recordings match your search' : 'No recordings yet'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery ? 'Try a different search term' : 'Start recording to see your audio files here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Recording</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Recording name"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={renameRecording}
              >
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recordingInfo: {
    flex: 1,
    marginBottom: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  recordingDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  recordingMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  playButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalConfirmButton: {
    backgroundColor: '#3B82F6',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});