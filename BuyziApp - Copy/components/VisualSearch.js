import React, { useState, useEffect } from 'react';
import {
  Image,
  Text,
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VisualSearch({ onClose, navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [predictedClass, setPredictedClass] = useState(null);
  const [confidence, setConfidence] = useState(null); // New state for confidence
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // For fade-in animation

  // Simplified press handlers (no animation on press)
  const handleButtonPressIn = () => {};
  const handleButtonPressOut = () => {};
  const handleCardPressIn = () => {};
  const handleCardPressOut = () => {};

  // Fade-in animation for button and cards
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [items]); // Re-run when items change

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your gallery to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setPredictedClass(null);
      setConfidence(null); // Reset confidence
      setItems([]);
      await uploadImage(result.assets[0].uri); // Automatically upload image
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) {
      Alert.alert('No Image Selected', 'Please select an image to upload.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post(
        'http://192.168.203.117:8000/api/predict/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { class_name, confidence, products, error } = response.data;
      if (error) {
        // Handle error cases, including low confidence
        Alert.alert('Prediction Error', error || 'An error occurred during prediction.');
        setItems([]);
        setPredictedClass(null);
        setConfidence(null);
      } else if (class_name && products) {
        setPredictedClass(class_name.trim());
        setConfidence(confidence); // Set confidence from response
        setItems(Array.isArray(products) ? products : []);
      } else {
        Alert.alert('Prediction Error', 'No category or products detected from the image.');
        setItems([]);
        setPredictedClass(null);
        setConfidence(null);
      }
    } catch (error) {
      console.error('Upload error:', error.message);
      Alert.alert('Upload Failed', 'Could not connect to the server. Please try again.');
      setItems([]);
      setPredictedClass(null);
      setConfidence(null);
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'product') {
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              navigation.navigate('ProductDetails', { productId: item.id });
            }}
            onPressIn={handleCardPressIn}
            onPressOut={handleCardPressOut}
            accessibilityRole="button"
            accessibilityLabel={`View product ${item.name}`}
          >
            <View style={styles.itemImageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  accessibilityLabel={`${item.name} image`}
                  onError={(e) => console.error('Item image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={36} color="#6B7280" />
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return null;
  };

  const renderHeader = () => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Close visual search"
      >
        <Ionicons name="close" size={28} color="#1F2A44" />
      </TouchableOpacity>
      <Text style={styles.header}>Visual Search</Text>

      {!imageUri ? (
        <>
          <Text style={styles.introText}>
            Discover products by uploading an image. Our Visual Search feature instantly identifies
            similar items from our catalog to help you find what you're looking for.
          </Text>
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={[styles.button, uploading && styles.buttonDisabled]}
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.7}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              accessibilityRole="button"
              accessibilityLabel="Choose image"
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.buttonGradient}
              >
                <Ionicons name="image-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Choose Image</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        <>
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={[styles.button, uploading && styles.buttonDisabled]}
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.7}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              accessibilityRole="button"
              accessibilityLabel="Choose image"
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.buttonGradient}
              >
                <Ionicons name="image-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Choose Image</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              accessibilityLabel="Selected image"
              onError={(e) => console.error('Selected image load error:', e.nativeEvent.error)}
            />
          </View>

          <View style={styles.predictionContainer}>
            <Text style={styles.title}>Prediction</Text>
            {predictedClass ? (
              <>
                <Text style={styles.predictionText}>{predictedClass}</Text>
                
              </>
            ) : (
              <Text style={styles.noPrediction}>No prediction yet</Text>
            )}
          </View>

          <View style={styles.productsContainer}>
            <Text style={styles.title}>Related Products</Text>
            {uploading && (
              <ActivityIndicator size="large" color="#10B981" style={styles.loader} />
            )}
            {!uploading && items.length === 0 && (
              <View style={styles.noProductsContainer}>
                <Ionicons name="cart-outline" size={40} color="#6B7280" />
                <Text style={styles.noProducts}>No products found in this category.</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  // Data for FlatList (only products when image is selected)
  const listData = imageUri && !uploading && items.length > 0
    ? items.map(item => ({ ...item, type: 'product' }))
    : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  flatListContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    zIndex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2A44',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 24,
    letterSpacing: 0.5,
  },
  introText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  button: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  predictionContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  predictionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#10B981',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
  },
  noPrediction: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  productsContainer: {
    marginTop: 24,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 8,
    lineHeight: 22,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  noProductsContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  noProducts: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 24,
  },
});