import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getProducts, toggleFavorite } from '../api/api';
import VisualSearch from '../components/VisualSearch';
import VoiceSearch from '../components/VoiceSearch';

// Import category images
import BalletCategory from '../assets/p/Ballet_category (1).jpg';
import BoatCategory from '../assets/p/Boat_categor.webp';
import BrogueCategory from '../assets/p/Brogue_category.jpg';
import ClogCategory from '../assets/p/clog_category.jpg';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isVisualSearchVisible, setIsVisualSearchVisible] = useState(false);
  const [isVoiceSearchVisible, setIsVoiceSearchVisible] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const banners = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=250&q=80', // Sneaker
    'https://images.unsplash.com/photo-1595461135849-bf08893fdc2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=250&q=80', // Boat shoe
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=250&q=80', // Brogue
    'https://images.unsplash.com/photo-1621335222953-1e54e1d11e9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=250&q=80', // Clog
  ];

  const categories = [
    { name: 'All', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=70&h=70&q=80' },
    { name: 'Ballet Flat', image: BalletCategory },
    { name: 'Boat', image: BoatCategory },
    { name: 'Brogue', image: BrogueCategory },
    { name: 'Clog', image: ClogCategory },
    { name: 'Sneaker', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=70&h=70&q=80' },
  ];

  const fetchProducts = async (category = null) => {
    try {
      setError(null);
      setRefreshing(true);
      const response = await getProducts();

      if (response.data && Array.isArray(response.data)) {
        let updatedProducts = response.data.map(product => ({
          id: product.id,
          name: product.name || 'Unnamed Product',
          price: parseFloat(product.price) || 0,
          original_price: product.original_price ? parseFloat(product.original_price) : null,
          image: product.image || 'https://via.placeholder.com/150',
          stock: Number(product.stock) || 0,
          is_favourite: product.is_favourite || false,
          description: product.description || 'No description available',
          category: product.category || null,
        }));

        if (category && category !== 'All') {
          updatedProducts = updatedProducts.filter(product =>
            product.category === category
          );
        }

        setProducts(updatedProducts);
      } else {
        throw new Error("Invalid product data format");
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError(error);

      if (error.message.includes('Session expired')) {
        Alert.alert(
          "Session Expired",
          "Please login again to continue",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => navigation.navigate('AccountScreen') }
          ]
        );
      } else {
        Alert.alert(
          "Connection Error",
          error.message || "Couldn't load products. Please try again.",
          [{ text: "Try Again", onPress: () => fetchProducts(category) }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchProducts(selectedCategory));
    fetchProducts(selectedCategory);

    const interval = setInterval(() => {
      setBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation, selectedCategory]);

  const handleToggleFavorite = async (productId) => {
    try {
      const response = await toggleFavorite(productId);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, is_favourite: response.is_favourite }
            : product
        )
      );
      Alert.alert(
        "Success",
        response.is_favourite
          ? "Product added to favorites"
          : "Product removed from favorites"
      );
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      Alert.alert("Error", error.message || "Failed to update favorite");
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e5533a" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <AntDesign name="warning" size={50} color="#e5533a" />
        <Text style={styles.errorText}>Failed to load products</Text>
        <Text style={styles.errorSubtext}>{error.message || "Please check your connection"}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProducts(selectedCategory)}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BUYZI</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.icon} />
            <TextInput style={styles.searchInput} placeholder="Search products..." />
            <TouchableOpacity onPress={() => setIsVoiceSearchVisible(true)}>
              <Ionicons name="mic" size={24} color="gray" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => setIsVisualSearchVisible(true)}
          >
            <Ionicons name="camera" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.category}
              onPress={() => {
                const categoryValue = category.name === 'All' ? null : category.name.toUpperCase().replace(' ', '_');
                setSelectedCategory(categoryValue);
                fetchProducts(categoryValue);
              }}
            >
              <Image
                source={typeof category.image === 'string' ? { uri: category.image } : category.image}
                style={styles.categoryImage}
                resizeMode="cover"
                defaultSource={{ uri: 'https://via.placeholder.com/70' }}
              />
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: banners[bannerIndex] }}
            style={styles.bannerImage}
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/1200x250' }}
          />
        </View>

        {/* Product List */}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productList}
          refreshing={refreshing}
          onRefresh={() => fetchProducts(selectedCategory)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.productImage}
                resizeMode="contain"
                defaultSource={{ uri: 'https://via.placeholder.com/150' }}
              />
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                {item.original_price && (
                  <Text style={styles.originalPrice}>${item.original_price.toFixed(2)}</Text>
                )}
              </View>
              <Text style={[
                styles.stockText,
                item.stock <= 0 ? styles.outOfStock : styles.inStock
              ]}>
                {item.stock > 0 ? `In Stock (${item.stock})` : 'Out of Stock'}
              </Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(item.id)}
              >
                <AntDesign
                  name={item.is_favourite ? "heart" : "hearto"}
                  size={20}
                  color={item.is_favourite ? "#E55B5B" : "#A9A9A9"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <AntDesign name="frowno" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No products available</Text>
                <Text style={styles.emptySubtext}>Check back later for new arrivals</Text>
              </View>
            )
          }
        />
      </ScrollView>

      {/* Visual Search Modal */}
      <Modal visible={isVisualSearchVisible} animationType="slide">
        <VisualSearch
          onClose={() => setIsVisualSearchVisible(false)}
          navigation={navigation}
        />
      </Modal>

      {/* Voice Search Modal */}
      <Modal visible={isVoiceSearchVisible} animationType="slide">
        <VoiceSearch
          onClose={() => setIsVoiceSearchVisible(false)}
          navigation={navigation}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5533a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: '60%',
    paddingHorizontal: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
  },
  icon: {
    marginRight: 5,
  },
  iconWrapper: {
    padding: 5,
  },
  categoryContainer: {
    marginTop: 15,
    paddingLeft: 15,
  },
  category: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
  bannerContainer: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  bannerImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 25,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  productList: {
    paddingHorizontal: 10,
  },
  productCard: {
    flex: 1,
    margin: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '48%',
  },
  productImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#e5533a',
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  stockText: {
    fontSize: 12,
    marginBottom: 5,
  },
  inStock: {
    color: '#4CAF50',
  },
  outOfStock: {
    color: '#e5533a',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
    marginHorizontal: 30,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e5533a',
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
});