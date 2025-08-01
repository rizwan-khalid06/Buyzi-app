import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SectionList,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { getUserProfile, loginUser, getFavorites, toggleFavorite } from '../api/api';
import axios from 'axios';
import buyziLogo from '../assets/images/NewLogo.png'; 

const API_BASE_URL = 'http://192.168.98.117.117:8000/api/'; 

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default function AccountScreen() {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1)); // For button animation

  // Button press animation
  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const rawToken = await AsyncStorage.getItem('authToken');
      if (rawToken) {
        setIsLoggedIn(true);
        await Promise.all([fetchProfile(), fetchFavorites()]);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking auth token:', error);
      setIsLoggedIn(false);
      Alert.alert('Error', 'Failed to verify authentication status.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await getUserProfile();
      setUser(response);
      setAddress(response.address || 'No address provided');
    } catch (error) {
      console.error('Profile fetch error:', error.message);
      Alert.alert('Error', error.message || 'Unable to load profile data.');
      setIsLoggedIn(false);
    }
  }, []);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Favorites fetch error:', error.message);
      Alert.alert('Error', error.message || 'Unable to load favorites.');
    }
  }, []);

  // Toggle favorite status
  const handleToggleFavorite = useCallback(
    async (productId) => {
      try {
        await toggleFavorite(productId);
        await fetchFavorites();
      } catch (error) {
        console.error('Toggle favorite error:', error.message);
        Alert.alert('Error', error.message || 'Unable to update favorite status.');
      }
    },
    [fetchFavorites]
  );

  // Update profile
  const updateProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const rawToken = await AsyncStorage.getItem('authToken');
      const token = rawToken ? JSON.parse(rawToken) : null;
      if (!token || !token.access) {
        throw new Error('No access token available');
      }

      const response = await api.put(
        '/user/profile/update/',
        { name: user?.name, email: user?.email, address },
        { headers: { Authorization: `Bearer ${token.access}` } }
      );
      setUser(response.data);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Profile update error:', error.message);
      Alert.alert('Error', error.message || 'Unable to update profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [user, address]);

  // Handle login
  const handleLogin = useCallback(async () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoginLoading(true);
    try {
      await loginUser({ email, password });
      setIsLoggedIn(true);
      setUser(null);
      setEmail('');
      setPassword('');
      setErrors({});
      await Promise.all([fetchProfile(), fetchFavorites()]);
    } catch (error) {
      console.error('Login error:', error.message);
      Alert.alert('Login Error', error.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  }, [email, password, fetchProfile, fetchFavorites]);

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              setIsLoggedIn(false);
              setUser(null);
              setFavorites([]);
              setAddress('');
              setEmail('');
              setPassword('');
              setErrors({});
              Alert.alert('Logged Out', 'You have logged out successfully.');
            } catch (error) {
              console.error('Logout error:', error.message);
              Alert.alert('Error', 'Failed to log out.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Render login screen
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Image
          source={buyziLogo}
          style={styles.logo}
          accessibilityLabel="Buyzi logo"
        />
        <View style={styles.loginCard}>
          <Text style={styles.headerTitle}>Welcome to Buyzi</Text>
          <Text style={styles.subTitle}>Sign in to access your account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Email input"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Password"
              style={[styles.input, errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password input"
            />
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loginLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {loginLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
          >
            <Text style={styles.signup}>
              New to Buyzi? <Text style={styles.signupLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render loading screen
  if (loading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff5f6d" accessibilityLabel="Loading" />
      </View>
    );
  }

  // Data for SectionList
  const sections = [
    {
      title: 'Personal Information',
      data: [
        {
          type: 'profile',
          render: () => (
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </Text>
                </View>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="user" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.profileInput, styles.disabledInput]}
                    value={user.name}
                    editable={false}
                    accessibilityLabel="Full name"
                  />
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="envelope" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.profileInput, styles.disabledInput]}
                    value={user.email}
                    editable={false}
                    accessibilityLabel="Email address"
                  />
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Shipping Address</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="map-marker" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.profileInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your shipping address"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    accessibilityLabel="Shipping address"
                  />
                </View>
              </View>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.profileButton, profileLoading && styles.buttonDisabled]}
                  onPress={updateProfile}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={profileLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Update profile"
                >
                  {profileLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          ),
        },
      ],
    },
    {
      title: 'My Favorites',
      data: favorites.length > 0 ? favorites : [{ type: 'empty', id: 'empty' }],
      renderItem: ({ item }) => {
        if (item.type === 'empty') {
          return <Text style={styles.emptyText}>Your favorites list is empty</Text>;
        }
        return (
          <TouchableOpacity
            style={styles.favoriteItem}
            onPress={() => navigation.navigate('Favorites', { productId: item.id })}
            accessibilityRole="button"
            accessibilityLabel={`View favorite ${item.name}`}
          >
            <Text style={styles.favoriteText}>{item.name}</Text>
            <TouchableOpacity
              style={styles.favoriteToggle}
              onPress={() => handleToggleFavorite(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Toggle favorite ${item.name}`}
            >
              <AntDesign name="heart" size={20} color="#ff5f6d" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      },
      ListFooterComponent: favorites.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Favorites')}
          accessibilityRole="button"
          accessibilityLabel="View all favorites"
        >
          <Text style={styles.viewAllText}>View All Favorites</Text>
        </TouchableOpacity>
      ),
    },
    
    {
      
      data: [
        {
          type: 'logout',
          render: () => (
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          ),
        },
      ],
    },
  ];

  // Render profile screen with SectionList
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id?.toString() || `section-${index}`}
        renderItem={({ item }) => (item.render ? item.render() : null)}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        contentContainerStyle={styles.profileContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f7f9fc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 220,
    height: 170,
    marginBottom: 20,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  profileContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  signInButton: {
    backgroundColor: '#ff5f6d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ff5f6d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ff8f99',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  signup: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    marginTop: 20,
  },
  signupLink: {
    color: '#ff5f6d',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8ecef',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff5f6d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginLeft: 12,
  },
  profileInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  profileButton: {
    backgroundColor: '#ff5f6d',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ff5f6d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#ff5f6d',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  favoriteText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  favoriteToggle: {
    padding: 8,
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#ff5f6d',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
});