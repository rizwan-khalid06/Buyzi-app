import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import StartScreen from "./screens/StartScreen";
import HomeScreen from "./screens/HomeScreen";
import ProductDetailsScreen from "./screens/ProductDetailsScreen";
import CartScreen from "./screens/CartScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import AccountScreen from "./screens/AccountScreen";
import RegisterScreen from "./components/Auth/RegisterScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import ShippingDetailsScreen from "./screens/ShippingDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderConfirmationScreen from "./screens/OrderConfirmationScreen";

import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RootStack = createStackNavigator();
const HomeStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ff6347",
        tabBarInactiveTintColor: "#b0b0b0",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 60,
          paddingBottom: 5,
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Start" screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Start" component={StartScreen} />
        <RootStack.Screen name="Home" component={MainTabs} />
        <RootStack.Screen name="Checkout" component={CheckoutScreen} />
        <RootStack.Screen name="ShippingDetails" component={ShippingDetailsScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="Profile" component={ProfileScreen} />
        <RootStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}