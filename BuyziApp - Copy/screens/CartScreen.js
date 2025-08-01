import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { getCartItems, updateCartItem, removeCartItem } from '../api/api';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Track selected item IDs
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCartItems();
      console.log('📦 Cart fetched:', JSON.stringify(data, null, 2));
      // Parse product_price and filter invalid items
      const validItems = data
        .map(item => {
          const parsedPrice = parseFloat(item.product_price);
          if (isNaN(parsedPrice) || item.product_price == null) {
            console.warn(`Invalid item price: ${JSON.stringify(item)}`);
            return null;
          }
          return { ...item, product_price: parsedPrice };
        })
        .filter(item => item !== null);
      console.log('🛒 Valid items:', JSON.stringify(validItems, null, 2));
      setCartItems(validItems);
    } catch (err) {
      console.error('❌ Failed to load cart:', err.message);
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) fetchCart();
  }, [isFocused]);

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) {
      handleRemove(itemId);
      return;
    }

    try {
      const item = cartItems.find((cartItem) => cartItem.id === itemId);
      if (!item) {
        throw new Error('Cart item not found');
      }

      const color = item.color && item.color.trim() ? item.color : 'default';
      const size = item.size && item.size.trim() ? item.size : 'default';

      await updateCartItem(itemId, newQty, color, size);
      fetchCart();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId);
      setSelectedItems(selectedItems.filter(id => id !== itemId));
      fetchCart();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateItemTotal = (price, quantity) => {
    const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    return validPrice * quantity;
  };

  const getTotal = () => {
    return cartItems
      .reduce((acc, item) => {
        const { product_price, quantity } = item;
        return acc + calculateItemTotal(product_price, quantity);
      }, 0)
      .toFixed(2);
  };

  const renderItem = ({ item }) => {
    const { product_name, product_price, image, color, size, quantity } = item;
    const imageUri = image || 'https://via.placeholder.com/90';

    return (
      <View style={styles.itemCard}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) => console.log(`Failed to load image for ${product_name}: ${image}`, e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.details}>
          <Text style={styles.name}>{product_name || 'Unknown Product'}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${product_price.toFixed(2)}</Text>
          </View>
          <Text style={styles.detail}>Size: {size || 'N/A'}</Text>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Qty:</Text>
            <TouchableOpacity onPress={() => handleQuantityChange(item.id, quantity - 1)}>
              <Icon name="remove-circle-outline" size={24} color="tomato" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity onPress={() => handleQuantityChange(item.id, quantity + 1)}>
              <Icon name="add-circle-outline" size={24} color="green" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeButton}>
            <Icon name="trash-outline" size={20} color="#666" />
            <Text style={styles.removeText}>REMOVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Normalize all cartItems for CheckoutScreen
  const normalizedCartItems = cartItems.map(item => ({
    id: item.product,
    name: item.product_name,
    price: typeof item.product_price === 'number' ? item.product_price : 0,
    quantity: item.quantity,
    selectedSize: item.size || 'N/A',
    selectedColor: item.color || 'N/A',
    image: item.image || 'https://via.placeholder.com/90',
  }));

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>SHOPPING BAG</Text>
      </View>

      {cartItems.length === 0 ? (
        <Text style={styles.empty}>🛒 Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.priceDetails}>
            <Text style={styles.priceDetailsTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price ({cartItems.length} items)</Text>
              <Text style={styles.priceValue}>${cartItems.reduce((acc, item) => acc + calculateItemTotal(item.product_price, item.quantity), 0).toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={styles.priceValue}>$0</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
              <Text style={styles.totalAmount}>${cartItems.reduce((acc, item) => acc + calculateItemTotal(item.product_price, item.quantity), 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.couponSection}>
            <View style={styles.couponRow}>
              <Icon name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.couponText}>Apply Coupons</Text>
            </View>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyText}>APPLY</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => navigation.navigate('Checkout', { cartItems: normalizedCartItems })}
          >
            <Text style={styles.proceedText}>PROCEED</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  empty: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#333',
  },
  quantity: {
    fontSize: 16,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  removeText: {
    color: '#666',
    marginLeft: 5,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  priceDetails: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  priceDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 16,
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  couponSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginTop: 10,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  applyButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9e0e0',
    borderRadius: 5,
  },
  applyText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  proceedButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 5,
  },
  proceedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});