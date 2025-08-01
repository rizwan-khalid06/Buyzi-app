import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import api from '../../api/api';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tc, setTc] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!tc) newErrors.tc = 'You must agree to the terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('user/register/', {
        name,
        email,
        password,
        password2: confirmPassword,
        tc,
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Account created successfully');
        navigation.navigate('AccountScreen'); // Go to login screen
      } else {
        setErrors(response.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Registration failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subTitle}>Join Buyzi to start shopping</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Name"
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
            accessibilityLabel="Name input"
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Confirm Password"
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            accessibilityLabel="Confirm password input"
          />
          {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
        </View>

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={tc ? 'checked' : 'unchecked'}
            onPress={() => setTc(!tc)}
            color="#ff5f6d"
            accessibilityLabel="Terms and conditions checkbox"
          />
          <Text style={styles.label}>I agree to the Terms & Conditions</Text>
        </View>
        {errors.tc && <Text style={styles.error}>{errors.tc}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Register"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  card: {
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  button: {
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
    fontSize: 18,
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});