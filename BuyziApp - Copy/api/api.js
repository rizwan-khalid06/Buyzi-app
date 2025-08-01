import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';

const BASE_URL = 'http://192.168.203.117:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PRIVATE_ENDPOINTS = [
  /^user\/profile\/?/,
  /^products\/\d+\/toggle_favorite\/?/,
  /^cart\/?/,
  /^cart\/\d+\/?/,
  /^favourite\/?/,
  /^favourite\/toggle\/\d+\/?/,
  /^orders\/?/,
];

const isTokenExpired = (token) => {
  try {
    const decoded = jwt_decode(token);
    return Date.now() >= decoded.exp * 1000;
  } catch (err) {
    console.log(' Failed to decode token:', err);
    return true;
  }
};

const needsAuth = (url) => {
  try {
    const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
    const path = new URL(fullUrl).pathname.replace(/^\/api\//, '');
    return PRIVATE_ENDPOINTS.some((pattern) => pattern.test(path));
  } catch (e) {
    console.log(' Failed to parse URL:', url);
    return false;
  }
};

let refreshPromise = null;
let navigation = null;

const setNavigation = (nav) => {
  navigation = nav;
};

api.interceptors.request.use(async (config) => {
  const rawToken = await AsyncStorage.getItem('authToken');
  if (!rawToken) return config;

  let tokenObj = null;
  try {
    tokenObj = JSON.parse(rawToken);
  } catch {
    await AsyncStorage.removeItem('authToken');
    return config;
  }

  const { access, refresh } = tokenObj;

  if (needsAuth(config.url)) {
    if (isTokenExpired(access)) {
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${BASE_URL}token/refresh/`, { refresh });
        }

        const refreshResponse = await refreshPromise;
        refreshPromise = null;

        const newAccess = refreshResponse.data.access;
        const newToken = { ...tokenObj, access: newAccess };
        await AsyncStorage.setItem('authToken', JSON.stringify(newToken));
        config.headers.Authorization = `Bearer ${newAccess}`;
      } catch (error) {
        await AsyncStorage.removeItem('authToken');
        refreshPromise = null;
        if (navigation) {
          navigation.navigate('Account');
        }
        throw new Error('Session expired. Please login again.');
      }
    } else {
      config.headers.Authorization = `Bearer ${access}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    if (response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      if (navigation) {
        navigation.navigate('Account');
      }
    }
    return Promise.reject(error);
  }
);

const handleAuthError = (error, endpoint = '') => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return new Error(
          data.error ||
          data.non_field_errors?.[0] ||
          data.color?.[0] ||
          data.size?.[0] ||
          'Invalid input.'
        );
      case 401:
        return new Error('Session expired. Please login again.');
      case 404:
        return new Error(`${endpoint} not found.`);
      case 500:
        return new Error('Server error. Please try again later.');
      default:
        return new Error('An unexpected error occurred.');
    }
  } else if (error.request) {
    return new Error('No response from server. Check your network connection.');
  }
  return new Error(error.message || 'Unknown error.');
};

// ----------------- AUTH API -----------------
const registerUser = async (data) => {
  try {
    const response = await api.post('user/register/', data);
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

const loginUser = async (data) => {
  try {
    const response = await api.post('user/login/', data);
    const { token } = response.data;

    if (token?.access && token?.refresh) {
      await AsyncStorage.setItem('authToken', JSON.stringify(token));
    } else {
      throw new Error('Invalid token format from server');
    }

    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

const getUserProfile = async () => {
  try {
    const response = await api.get('user/profile/');
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

//  PRODUCT API 
const getProducts = async () => {
  try {
    const response = await api.get('products/');
    if (Array.isArray(response.data)) return { data: response.data };
    if (Array.isArray(response.data.results)) return { data: response.data.results };
    throw new Error('Invalid product format');
  } catch (error) {
    throw handleAuthError(error, 'products');
  }
};

const getProduct = async (productId) => {
  try {
    const response = await api.get(`products/${productId}/`);
    return response.data;
  } catch (error) {
    throw handleAuthError(error, `products/${productId}`);
  }
};

const toggleFavorite = async (productId) => {
  try {
    const response = await api.post(`favourite/toggle/${productId}/`);
    console.log(' Toggle favorite response:', response.data);
    return response.data; // Returns { status: string, is_favourite: boolean }
  } catch (error) {
    console.error(' Toggle favorite error:', error.response?.data || error.message);
    throw handleAuthError(error, `favourite/toggle/${productId}`);
  }
};

//  FAVORITE API 
const getFavorites = async () => {
  try {
    const response = await api.get('favourite/');
    console.log(' Get favorites response:', response.data);
    if (Array.isArray(response.data)) return { data: response.data };
    if (Array.isArray(response.data.results)) return { data: response.data.results };
    throw new Error('Invalid favorites format');
  } catch (error) {
    console.error(' Get favorites error:', error.response?.data || error.message);
    throw handleAuthError(error, 'favourite');
  }
};

//  CART API 
const getCartItems = async () => {
  try {
    const response = await api.get('cart/');
    console.log('📦 Cart response:', response.data);
    return response.data ?? [];
  } catch (error) {
    throw handleAuthError(error, 'cart');
  }
};

const addToCart = async (productId, quantity = 1, color = '', size = '') => {
  try {
    const rawToken = await AsyncStorage.getItem('authToken');
    const tokenObj = rawToken ? JSON.parse(rawToken) : null;
    const token = tokenObj?.access || null;

    if (!token) throw new Error('No access token available');

    const response = await api.post(
      'cart/',
      {
        product: productId,
        quantity,
        color: color || null,
        size: size || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('🛒 Added to cart:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Add to cart failed:', error.response?.data || error.message);
    throw handleAuthError(error, 'cart');
  }
};

const updateCartItem = async (itemId, quantity, color, size) => {
  try {
    console.log('Sending PATCH request to update cart item:', { itemId, quantity, color, size });
    const response = await api.patch(`cart/${itemId}/`, { quantity, color, size });
    console.log('✅ Update cart item response:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Update cart item error:', error.response?.data);
    throw handleAuthError(error, `cart/${itemId}`);
  }
};

const removeCartItem = async (itemId) => {
  try {
    await api.delete(`cart/${itemId}/`);
    console.log('✅ Removed cart item:', itemId);
  } catch (error) {
    console.error(' Remove cart item error:', error.response?.data);
    throw handleAuthError(error, `cart/${itemId}`);
  }
};

//  ORDER API 
const createOrder = async (orderData) => {
  try {
    const response = await api.post('orders/', {
      name: orderData.name,
      shipping_address: orderData.shipping_address,
      city: orderData.city,
      postal_code: orderData.postal_code,
      country: orderData.country,
      phone: orderData.phone,
      email: orderData.email || null,
    });
    console.log(' Order created:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Order creation failed:', error.response?.data || error.message);
    throw handleAuthError(error, 'orders');
  }
};

//  EXPORTS 
export default api;
export {
  setNavigation,
  registerUser,
  loginUser,
  getUserProfile,
  getProducts,
  getProduct,
  toggleFavorite,
  getFavorites,
  getCartItems,
  addToCart,
  updateCartItem,
  removeCartItem,
  createOrder,
};