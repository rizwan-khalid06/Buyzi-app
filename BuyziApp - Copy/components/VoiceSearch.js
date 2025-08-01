import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { getProducts } from '../api/api'; // Ensure this is correctly imported

const VoiceSearch = ({ onClose, navigation }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Valid categories to match against transcribed_text
  const validCategories = ['Ballet Flat', 'Boat', 'Brogue', 'Clog', 'Sneaker'];

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      console.log('[startRecording] Permission Status:', status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required for voice search.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        allowsRecordingAndroid: true,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);

      setTimeout(() => {
        if (isRecording) stopRecording();
      }, 10000);
    } catch (err) {
      console.error('[startRecording] Error:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      console.log('[stopRecording] Recording URI:', uri);
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[stopRecording] File Info:', fileInfo);

      if (!fileInfo.exists || fileInfo.size === 0) {
        Alert.alert('Error', 'The recorded audio file is empty or invalid.');
        return;
      }

      const debugFile = FileSystem.documentDirectory + 'test_recording.wav';
      await FileSystem.copyAsync({ from: uri, to: debugFile });
      console.log('[stopRecording] File saved to:', debugFile);

      await sendAudioToBackend(uri);
    } catch (err) {
      console.error('[stopRecording] Error:', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const fetchProductsByCategory = async (category) => {
    setProductsLoading(true);
    try {
      const response = await getProducts();
      if (response.data && Array.isArray(response.data)) {
        const updatedProducts = response.data
          .filter(product => product.category === category.toUpperCase().replace(' ', '_'))
          .map(product => ({
            id: product.id,
            name: product.name || 'Unnamed Product',
            price: parseFloat(product.price) || 0,
            image: product.image || 'https://via.placeholder.com/150',
            stock: Number(product.stock) || 0,
          }));

        setProducts(updatedProducts);
      } else {
        throw new Error('Invalid product data format');
      }
    } catch (error) {
      console.error('[fetchProductsByCategory] Error:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const sendAudioToBackend = async (uri) => {
    setLoading(true);
    console.log('[sendAudioToBackend] Sending audio to backend...');
    try {
      let audioUri = uri;
      if (!audioUri.startsWith('file://')) {
        audioUri = 'file://' + audioUri;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[sendAudioToBackend] File Info:', fileInfo);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Audio file is empty or invalid');
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        name: `recording-${Date.now()}.wav`,
        type: 'audio/wav',
      });

      const response = await fetch('http://192.168.203.117:8000/api/voice-search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      console.log('[sendAudioToBackend] Backend Response:', data);
      setSearchResults(data.search_results || []);

      // Extract category from transcribed_text with error handling
      if (data.transcribed_text && typeof data.transcribed_text === 'string') {
        const transcribed = data.transcribed_text.toLowerCase();
        const matchedCategory = validCategories.find(category =>
          transcribed.includes(category.toLowerCase())
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory);
          await fetchProductsByCategory(matchedCategory);
        } else {
          console.log('[sendAudioToBackend] No matching category found in transcription:', transcribed);
          Alert.alert('Category Not Found', 'No matching category found in transcription.');
          setProducts([]);
        }
      } else {
        console.log('[sendAudioToBackend] Invalid or missing transcribed_text:', data.transcribed_text);
        Alert.alert('Error', 'Invalid response from server. No transcription available.');
        setProducts([]);
      }
    } catch (error) {
      console.error('[sendAudioToBackend] Upload failed:', error);
      let errorMessage = 'Failed to upload audio to the server.';
      if (error.message.includes('Network request failed')) {
        errorMessage = 'No response from server. Please check your network or server status.';
      } else {
        errorMessage = error.message;
      }
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (navigation && navigation.navigate) {
          navigation.navigate('ProductDetails', { productId: item.id });
        } else {
          console.error('[renderProduct] Navigation object is undefined or navigate is not a function');
          Alert.alert('Navigation Error', 'Unable to navigate to product details.');
        }
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="contain"
      />
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      <Text style={styles.stockText}>
        {item.stock > 0 ? `In Stock (${item.stock})` : 'Out of Stock'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Voice Search</Text>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={loading || productsLoading}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>

      {(loading || productsLoading) && (
        <ActivityIndicator size="large" color="#000" style={styles.loading} />
      )}

      {selectedCategory && (
        <View style={styles.productsContainer}>
          <Text style={styles.productsLabel}>Products for {selectedCategory}</Text>
          {products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              style={styles.productList}
            />
          ) : (
            <Text style={styles.noResults}>No products found for {selectedCategory}.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 60,
    color: '#333',
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#e63946',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  loading: {
    marginTop: 20,
  },
  productsContainer: {
    marginTop: 20,
  },
  productsLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  productList: {
    marginTop: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 12,
    color: '#e5533a',
    textAlign: 'center',
  },
  stockText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default VoiceSearch;