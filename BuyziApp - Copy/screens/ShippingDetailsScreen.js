import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart, createOrder, getProduct } from '../api/api';

// Curated list of 10 countries, including Pakistan
const countries = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'India', value: 'IN' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Brazil', value: 'BR' },
  { label: 'China', value: 'CN' },
  { label: 'Pakistan', value: 'PK' },
];

// Simplified phone country codes for the 10 countries, including Pakistan
const phoneCountryCodes = [
  { label: '+1 (US/CA)', value: '+1' },
  { label: '+44 (UK)', value: '+44' },
  { label: '+91 (India)', value: '+91' },
  { label: '+61 (Australia)', value: '+61' },
  { label: '+49 (Germany)', value: '+49' },
  { label: '+33 (France)', value: '+33' },
  { label: '+55 (Brazil)', value: '+55' },
  { label: '+86 (China)', value: '+86' },
  { label: '+92 (Pakistan)', value: '+92' },
];

const ShippingDetailsScreen = ({ route, navigation }) => {
  const { cartItems = [] } = route.params || {};

  // Consolidated form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    email: '',
    country: null,
    phoneCountryCode: null,
    saveAddress: false,
  });

  // Dropdown visibility
  const [dropdownField, setDropdownField] = useState(null); // 'country', 'phoneCountryCode', or null
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs for mount and render control
  const isMounted = useRef(false);
  const skipValidation = useRef(true);
  const renderGuard = useRef(false);

  // Calculate total price
  const totalPrice = cartItems
    .reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      return total + price * item.quantity;
    }, 0)
    .toFixed(2);

  // Load saved address after mount
  useEffect(() => {
    isMounted.current = true;
    const loadSavedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem('savedAddress');
        if (savedAddress && isMounted.current) {
          const parsedAddress = JSON.parse(savedAddress);
          setFormData((prev) => ({
            ...prev,
            name: parsedAddress.name || '',
            address: parsedAddress.address || '',
            city: parsedAddress.city || '',
            zipCode: parsedAddress.zipCode || '',
            phone: parsedAddress.phone || '',
            email: parsedAddress.email || '',
            country: parsedAddress.country || null,
            phoneCountryCode: parsedAddress.phoneCountryCode || null,
          }));
          console.log('Loaded saved address:', parsedAddress);
        }
      } catch (error) {
        console.error('Failed to load saved address:', error);
      } finally {
        skipValidation.current = false;
      }
    };
    loadSavedAddress();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validate field
  const validateField = useCallback((field, value) => {
    if (skipValidation.current || renderGuard.current) {
      console.log(`Skipping validation for ${field} during initial render or render guard`);
      return true;
    }
    let error = '';
    switch (field) {
      case 'name':
        if (!value || value.length < 2) error = 'Full name required';
        break;
      case 'address':
        if (!value || value.length < 5) error = 'Valid address required';
        break;
      case 'city':
        if (!value || value.length < 2) error = 'City required';
        break;
      case 'zipCode':
        if (!value) error = 'Zip code required';
        else if (formData.country === 'US' && !/^\d{5}$/.test(value))
          error = '5-digit zip code required';
        else if (formData.country === 'IN' && !/^\d{6}$/.test(value))
          error = '6-digit zip code required';
        else if (formData.country === 'PK' && !/^\d{5}$/.test(value))
          error = '5-digit zip code required';
        else if (!/^[A-Za-z0-9-]{3,10}$/.test(value)) error = 'Invalid zip code';
        break;
      case 'phone':
        if (!value) error = 'Phone number required';
        else if (formData.phoneCountryCode === '+92' && !/^\d{10}$/.test(value))
          error = '10-digit phone number required for Pakistan';
        else if (!/^\d{7,15}$/.test(value)) error = 'Valid phone number required';
        break;
      case 'country':
        if (!value) error = 'Country required';
        break;
      case 'phoneCountryCode':
        if (!value) error = 'Country code required';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email';
        break;
    }
    setErrors((prev) => {
      console.log(`Validating ${field}:`, { value, error });
      return { ...prev, [field]: error };
    });
    return !error;
  }, [formData.country, formData.phoneCountryCode]);

  // Validate all fields
  const validateForm = useCallback(() => {
    console.log('Running validateForm');
    const fields = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      zipCode: formData.zipCode,
      phone: formData.phone,
      country: formData.country,
      phoneCountryCode: formData.phoneCountryCode,
      email: formData.email,
    };
    let isValid = true;
    Object.keys(fields).forEach((field) => {
      if (!validateField(field, fields[field])) isValid = false;
    });
    return isValid;
  }, [formData, validateField]);

  // Update form field
  const updateFormField = useCallback((field, value) => {
    if (renderGuard.current) {
      console.log(`Blocked updateFormField for ${field} during render`);
      return;
    }
    setFormData((prev) => {
      console.log(`Updating ${field}:`, value);
      return { ...prev, [field]: value };
    });
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback((field) => {
    if (renderGuard.current) {
      console.log(`Blocked toggleDropdown for ${field} during render`);
      return;
    }
    setDropdownField((prev) => (prev === field ? null : field));
    console.log(`Toggled dropdown: ${field}`);
  }, []);

  // Clear form
  const handleClearForm = useCallback(() => {
    setFormData({
      name: '',
      address: '',
      city: '',
      zipCode: '',
      phone: '',
      email: '',
      country: null,
      phoneCountryCode: null,
      saveAddress: false,
    });
    setErrors({});
    setDropdownField(null);
    console.log('Cleared form');
  }, []);

  // Submit order
  const handleConfirmShipping = useCallback(async () => {
    console.log('Attempting to submit order');
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix all errors before submitting.');
      console.log('Validation failed, submission aborted');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      console.log('Cart is empty, submission aborted');
      return;
    }

    setLoading(true);
    const invalidItems = [];
    try {
      for (const item of cartItems) {
        try {
          await getProduct(item.id);
          await addToCart(
            item.id,
            item.quantity,
            item.selectedColor === 'N/A' ? '' : item.selectedColor,
            item.selectedSize === 'N/A' ? '' : item.selectedSize
          );
        } catch (error) {
          console.error(`Failed to add item ${item.name} (ID: ${item.id}):`, error.message);
          invalidItems.push(`${item.name} (ID: ${item.id})`);
        }
      }

      if (invalidItems.length === cartItems.length) {
        Alert.alert('Error', `No valid items: ${invalidItems.join(', ')}.`);
        setLoading(false);
        console.log('No valid items, submission aborted');
        return;
      }

      if (invalidItems.length > 0) {
        Alert.alert(
          'Warning',
          `Some items invalid: ${invalidItems.join(', ')}. Proceed?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Proceed', onPress: async () => await submitOrder() },
          ]
        );
      } else {
        await submitOrder();
      }
    } catch (error) {
      console.error('Order failed:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to place order.');
      setLoading(false);
    }
  }, [cartItems, validateForm, submitOrder]);

  // Submit order to backend
  const submitOrder = useCallback(async () => {
    console.log('Submitting order to backend');
    try {
      const orderData = {
        name: formData.name,
        shipping_address: formData.address,
        city: formData.city,
        postal_code: formData.zipCode,
        country: countries.find((c) => c.value === formData.country)?.label || formData.country,
        phone: `${formData.phoneCountryCode}${formData.phone}`,
        email: formData.email || null,
      };

      if (formData.saveAddress) {
        await AsyncStorage.setItem(
          'savedAddress',
          JSON.stringify({
            name: formData.name,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            phone: formData.phone,
            country: formData.country,
            email: formData.email,
            phoneCountryCode: formData.phoneCountryCode,
          })
        );
        console.log('Saved address to AsyncStorage');
      }

      await createOrder(orderData);
      Alert.alert('Success', 'Order placed successfully!');
      console.log('Order placed successfully');
      navigation.navigate('OrderConfirmation');
    } catch (error) {
      console.error('Submit order failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [formData, navigation]);

  // Render cart item
  const renderCartItem = useCallback(({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.cartItemText}>
        {item.name} (Qty: {item.quantity}, {item.selectedColor}, {item.selectedSize})
      </Text>
      <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  ), []);

  // Render dropdown item
  const renderDropdownItem = useCallback(({ item, field }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        updateFormField(field, item.value);
        setDropdownField(null);
        console.log(`Selected ${field}: ${item.label}`);
      }}
    >
      <Text style={styles.dropdownItemText}>{item.label}</Text>
    </TouchableOpacity>
  ), [updateFormField]);

  // Render form content
  const renderFormContent = () => {
    renderGuard.current = true;
    const content = (
      <>
        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in cart</Text>
          ) : (
            <>
              {cartItems.map((item, index) => (
                <View key={index}>{renderCartItem({ item })}</View>
              ))}
              <Text style={styles.totalPrice}>Total: ${totalPrice}</Text>
            </>
          )}
        </View>

        {/* Shipping Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>

          {/* Personal Details Section */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Personal Details</Text>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateFormField('name', text)}
                onBlur={() => validateField('name', formData.name)}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          </View>

          {/* Address Details Section */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Address Details</Text>
            {/* Address */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(text) => updateFormField('address', text)}
                onBlur={() => validateField('address', formData.address)}
                placeholder="Enter your street address"
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* City */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => updateFormField('city', text)}
                onBlur={() => validateField('city', formData.city)}
                placeholder="Enter your city"
                autoCapitalize="words"
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            {/* Zip Code */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Zip Code *</Text>
              <TextInput
                style={[styles.input, errors.zipCode && styles.inputError]}
                value={formData.zipCode}
                onChangeText={(text) => updateFormField('zipCode', text)}
                onBlur={() => validateField('zipCode', formData.zipCode)}
                placeholder="Enter zip code"
                keyboardType="numeric"
              />
              {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
            </View>

            {/* Country */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Country *</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.country && styles.inputError]}
                onPress={() => toggleDropdown('country')}
              >
                <Text style={styles.dropdownButtonText}>
                  {formData.country
                    ? countries.find((c) => c.value === formData.country)?.label || 'Select Country'
                    : 'Select Country'}
                </Text>
                <Icon name={dropdownField === 'country' ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#333" />
              </TouchableOpacity>
              {dropdownField === 'country' && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {countries.map((item) => (
                      <View key={item.value}>
                        {renderDropdownItem({ item, field: 'country' })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
            </View>
          </View>

          {/* Contact Details Section */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Contact Details</Text>
            {/* Phone Country Code and Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.phoneContainer}>
                <TouchableOpacity
                  style={[styles.dropdownButton, styles.phoneCodeDropdown, errors.phoneCountryCode && styles.inputError]}
                  onPress={() => toggleDropdown('phoneCountryCode')}
                >
                  <Text style={styles.dropdownButtonText}>
                    {formData.phoneCountryCode
                      ? phoneCountryCodes.find((c) => c.value === formData.phoneCountryCode)?.label || 'Code'
                      : 'Code'}
                  </Text>
                  <Icon name={dropdownField === 'phoneCountryCode' ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#333" />
                </TouchableOpacity>
                {dropdownField === 'phoneCountryCode' && (
                  <View style={[styles.dropdownContainer, styles.phoneCodeDropdownContainer]}>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {phoneCountryCodes.map((item) => (
                        <View key={item.value}>
                          {renderDropdownItem({ item, field: 'phoneCountryCode' })}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <TextInput
                  style={[styles.phoneInput, errors.phone && styles.inputError]}
                  value={formData.phone}
                  onChangeText={(text) => updateFormField('phone', text)}
                  onBlur={() => validateField('phone', formData.phone)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  flex={1}
                />
              </View>
              {errors.phoneCountryCode && (
                <Text style={styles.errorText}>{errors.phoneCountryCode}</Text>
              )}
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => updateFormField('email', text)}
                onBlur={() => validateField('email', formData.email)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          {/* Save Address */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              onPress={() => updateFormField('saveAddress', !formData.saveAddress)}
              style={styles.checkbox}
            >
              <Icon
                name={formData.saveAddress ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={formData.saveAddress ? '#FF6F00' : '#666'}
              />
              <Text style={styles.checkboxText}>Save address for future use</Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#666' }]}
              onPress={handleClearForm}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, loading ? styles.buttonDisabled : {}]}
              onPress={handleConfirmShipping}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
    renderGuard.current = false;
    return content;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 50}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ScrollView for content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderFormContent()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6F00',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to ensure submit button is accessible
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cartItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'right',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6F00',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'space-between',
  },
  phoneCodeDropdown: {
    width: 120,
    marginRight: 8,
  },
  phoneCodeDropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 120,
    zIndex: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 150,
    zIndex: 10,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  dropdownList: {
    flexGrow: 0,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  phoneInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    minWidth: 0, // Prevent truncation
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#FF6F00',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShippingDetailsScreen;