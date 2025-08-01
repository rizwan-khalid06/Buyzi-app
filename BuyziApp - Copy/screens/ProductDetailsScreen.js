import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { getProduct, toggleFavorite, addToCart } from '../api/api';

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productData = await getProduct(productId);

      const formattedProduct = {
        ...productData,
        price: parseFloat(productData.price) || 0,
        original_price: productData.original_price ? parseFloat(productData.original_price) : null,
        stock: Number(productData.stock) || 0,
        is_favourite: productData.is_favourite || false,
        image: productData.image || 'https://via.placeholder.com/150',
        description: productData.description || 'No description available',
        available_colors: productData.available_colors || ['Black', 'White', 'Blue', 'Gray', 'Brown', ],
        available_sizes: productData.available_sizes || ['S', 'M', 'L', 'XL'],
      };

      setProduct(formattedProduct);
      setSelectedColor(formattedProduct.available_colors[0] || null);
      setSelectedSize(formattedProduct.available_sizes[0] || null);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', error.message || 'Couldn\'t load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleToggleFavorite = async () => {
    try {
      const response = await toggleFavorite(productId);
      setProduct((prev) => ({ ...prev, is_favourite: response.is_favourite }));
      Alert.alert(
        "Success",
        response.is_favourite
          ? "Product added to favorites"
          : "Product removed from favorites"
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('Error', error.message || 'Couldn’t update favorites');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      Alert.alert('Selection Required', 'Please choose size and color');
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(productId, 1, selectedColor, selectedSize);

      Alert.alert(
        'Added to Cart',
        `${product.name} (${selectedSize}, ${selectedColor}) was added to your cart`,
        [
          {
            text: 'Continue Shopping',
            style: 'cancel',
            onPress: () => setIsAddingToCart(false),
          },
          {
            text: 'View Cart',
            onPress: () => {
              setIsAddingToCart(false);
              navigation.navigate('Cart');
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage = error.message || 'Failed to add item to cart';
      Alert.alert('Cart Error', errorMessage, [
        { text: 'OK', onPress: () => setIsAddingToCart(false) },
      ]);
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) {
      Alert.alert('Selection Required', 'Please choose size and color');
      return;
    }

    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    setIsBuyingNow(true);

    try {
      const checkoutItem = {
        id: productId,
        name: product.name,
        price: product.price,
        quantity: 1,
        selectedSize: selectedSize || 'N/A',
        selectedColor: selectedColor || 'N/A',
        image: product.image || 'https://via.placeholder.com/90',
      };

      navigation.navigate('Checkout', { cartItems: [checkoutItem] });
    } catch (error) {
      console.error('Failed to proceed to checkout:', error);
      Alert.alert('Error', error.message || 'Couldn’t proceed to checkout');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const colorMap = {
    black: '#000000',
    white: '#FFFFFF',
    blue: '#1976D2',
    red: '#D32F2F',
    brown: '#8B4513',
    yellow: '#FFCA28',
  };

  const getColorValue = (color) => {
    if (!color) return '#CCCCCC';
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      return color.toUpperCase();
    }
    return colorMap[color.toLowerCase()] || '#CCCCCC';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={40} color="#D32F2F" />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProduct}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            defaultSource={{ uri: 'https://via.placeholder.com/150' }}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <AntDesign
              name={product.is_favourite ? 'heart' : 'hearto'}
              size={24}
              color={product.is_favourite ? '#D32F2F' : '#FFF'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            {product.original_price && (
              <Text style={styles.originalPrice}>${product.original_price.toFixed(2)}</Text>
            )}
            <Text
              style={[
                styles.stockBadge,
                product.stock > 0 ? styles.inStock : styles.outOfStock,
              ]}
            >
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.badgeContainer}>
            {product.is_star_seller && (
              <View style={styles.starSellerBadge}>
                <AntDesign name="star" size={14} color="#FFF" />
                <Text style={styles.badgeText}>Star Seller</Text>
              </View>
            )}
            <View style={styles.authenticBadge}>
              <AntDesign name="checkcircle" size={14} color="#FFF" />
              <Text style={styles.badgeText}>100% Authentic</Text>
            </View>
            <View style={styles.returnBadge}>
              <Ionicons name="return-down-back" size={14} color="#FFF" />
              <Text style={styles.badgeText}>14 Days Return</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.sizeContainer}>
            {product.available_sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeOption, selectedSize === size && styles.selectedSize]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={selectedSize === size ? styles.selectedSizeText : styles.sizeText}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorContainer}>
            {product.available_colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  selectedColor === color && styles.selectedColorOption,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <View style={[styles.colorCircle, { backgroundColor: getColorValue(color) }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!selectedSize || !selectedColor || isAddingToCart || product.stock === 0) &&
              styles.disabledButton,
          ]}
          onPress={handleAddToCart}
          disabled={!selectedSize || !selectedColor || isAddingToCart || product.stock === 0}
        >
          {isAddingToCart ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.addToCartText}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buyNowButton,
            (!selectedSize || !selectedColor || isBuyingNow || product.stock === 0) &&
              styles.disabledButton,
          ]}
          onPress={handleBuyNow}
          disabled={!selectedSize || !selectedColor || isBuyingNow || product.stock === 0}
        >
          {isBuyingNow ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buyNowText}>
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', // White background like the Clicky app
  },
  scrollContent: {
    paddingBottom: 80, // Adjusted for sticky button bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  errorText: {
    fontSize: 18,
    color: '#424242',
    marginTop: 10,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#D32F2F',
    borderRadius: 5,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#000', // Black background for image as in Clicky app
    paddingHorizontal: 15,
    paddingTop: 40,
  },
  productImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 45,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 5,
  },
  detailsContainer: {
    padding: 15,
    backgroundColor: '#FFF',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D32F2F',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  inStock: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
  },
  outOfStock: {
    backgroundColor: '#FF5722',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 15,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  starSellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  authenticBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBC02D',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  sizeOption: {
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedSize: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF',
  },
  sizeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedSizeText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedColorOption: {
    borderColor: '#D32F2F',
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 3,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buyNowText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});