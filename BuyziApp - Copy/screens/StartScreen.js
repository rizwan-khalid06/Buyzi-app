import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const StartScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      {/* Logo Animation */}
      <Animated.View entering={FadeInDown.duration(700).delay(100)} style={styles.logoContainer}>
        <Image
          source={require('../assets/images/NewLogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title and Subtitle */}
      <Animated.View entering={FadeInUp.duration(800).delay(300)} style={styles.textWrapper}>
        <Text style={styles.title}>Welcome to BuyziApp</Text>
        <Text style={styles.subtitle}>Your one-stop shopping solution</Text>
      </Animated.View>

      {/* Button */}
      <Animated.View entering={FadeInUp.duration(1000).delay(700)}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.1,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#E0285A',
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 30,
    shadowColor: '#E0285A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default StartScreen;
