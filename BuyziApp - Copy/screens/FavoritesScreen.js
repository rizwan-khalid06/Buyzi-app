import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { toggleFavorite, getFavorites } from '../api/api';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      setFavorites(response.data.map(item => ({
        id: item.id,
        name: item.name || 'Unnamed Product',
        price: parseFloat(item.price) || 0,
        image: item.image || 'https://via.placeholder.com/150',
        description: item.description || 'No description available',
      })));
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      Alert.alert("Error", error.message || "Failed to load favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchFavorites);
    return unsubscribe;
  }, [navigation]);

  const handleRemoveFavorite = async (productId) => {
    try {
      await toggleFavorite(productId);
      await fetchFavorites(); // Refresh the list
      Alert.alert("Success", "Product removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      Alert.alert("Error", error.message || "Failed to remove favorite");
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e5533a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Favorites</Text>
      
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={fetchFavorites}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AntDesign name="hearto" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>Tap the heart icon to add favorites</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() =>
              navigation.navigate('Home', {
                screen: 'ProductDetails',
                params: {
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  description: item.description,
                },
              })
            }
          >
            <Image 
              source={{ uri: item.image }} 
              style={styles.productImage}
            />
            <View style={styles.textContainer}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveFavorite(item.id)}
            >
              <MaterialIcons name="delete" size={24} color="#e5533a" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  removeButton: {
    padding: 8,
  },
});