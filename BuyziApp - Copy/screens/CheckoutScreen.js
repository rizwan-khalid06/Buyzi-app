import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { getProduct } from '../api/api';

const CheckoutScreen = ({ route, navigation }) => {
  const initialCartItems = route?.params?.cartItems || [];
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Validate cart items on mount
  useEffect(() => {
    const validateCartItems = async () => {
      const validItems = [];
      const invalidItems = [];

      for (const item of initialCartItems) {
        try {
          await getProduct(item.id); // Changed to item.id (Product ID from CartScreen)
          validItems.push(item);
        } catch (error) {
          console.error(`Invalid product ${item.name} (ID: ${item.id}):`, error.message);
          invalidItems.push(`${item.name} (ID: ${item.id})`);
        }
      }

      if (invalidItems.length > 0) {
        Alert.alert(
          'Invalid Cart Items',
          `Some items are no longer available: ${invalidItems.join(', ')}. They have been removed from your cart.`,
          [{ text: 'OK' }]
        );
      }

      setCartItems(validItems);
    };

    validateCartItems();
  }, []);

  const subtotal = cartItems
    .reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      return total + price * item.quantity;
    }, 0)
    .toFixed(2);
  const discount = (0).toFixed(2);
  const totalPrice = (parseFloat(subtotal) - parseFloat(discount)).toFixed(2);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty. Please add items to proceed.');
      return;
    }
    setIsPlacingOrder(true);
    navigation.navigate("ShippingDetails", { cartItems });
    setIsPlacingOrder(false);
  };

  const handleEditShipping = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty. Please add items to proceed.');
      return;
    }
    navigation.navigate("ShippingDetails", { cartItems });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      {item.image && item.image !== 'https://via.placeholder.com/90' ? (
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          resizeMode="cover"
          onError={(e) => console.log(`Failed to load image for ${item.name}: ${item.image}`, e.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>
          {item.name} ({item.selectedSize}, {item.selectedColor})
        </Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.itemPrice}>
          ${(typeof item.price === 'number' ? item.price * item.quantity : 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <Text style={styles.empty}>Your cart is empty.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCartItem}
              contentContainerStyle={styles.cartList}
              scrollEnabled={false} // Disable FlatList scrolling to let ScrollView handle it
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>${subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={styles.priceValue}>${discount}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${totalPrice}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <TouchableOpacity onPress={handleEditShipping}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>
              123 Main St, City, Country
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentRow}>
              <Icon name="cash-outline" size={20} color="#333" />
              <Text style={styles.paymentText}>Cash on Delivery</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f4f6f8', // Removed flex: 1 since ScrollView handles scrolling
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 20, // Add padding to ensure content isn't cut off at the bottom
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#777',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#aaa',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    color: '#ff5722',
    fontWeight: '600',
  },
  cartList: {
    paddingBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemImage: {
    width: 80,
    height: 80,
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
  itemDetails: {
    marginLeft: 15,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  placeOrderButton: {
    backgroundColor: '#ff5722',
    paddingVertical: 15,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});