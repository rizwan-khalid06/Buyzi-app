import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import api from '../api/api';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchProfile = async () => {
    try {
      const rawToken = await AsyncStorage.getItem('authToken');
      if (!rawToken) {
        Alert.alert('Error', 'No authentication token found.');
        navigation.navigate('AccountScreen');
        return;
      }

      const token = JSON.parse(rawToken);
      const response = await api.get('user/profile/', {
        headers: {
          Authorization: `Bearer ${token.access}`,
        },
      });

      if (response.status === 200) {
        setUser(response.data);
      } else {
        Alert.alert('Error', 'Failed to load profile.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#ff5f6d" />;
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Profile</Text>
      {user ? (
        <>
          <Text style={styles.info}>Name: {user.name}</Text>
          <Text style={styles.info}>Email: {user.email}</Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await AsyncStorage.removeItem('authToken');
              Alert.alert('Logged Out', 'You have logged out successfully.');
              navigation.navigate('AccountScreen');
            }}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>No user data available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 50, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 1 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  info: { fontSize: 18, marginVertical: 5 },
  logoutButton: {
    backgroundColor: '#ff5f6d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});