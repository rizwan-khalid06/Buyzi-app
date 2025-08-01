from rest_framework import serializers
from .models import Order, OrderItem
from product.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'color', 'size', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'shipping_address', 'city', 'postal_code', 'country', 'created_at', 'items']
        read_only_fields = ['id', 'user', 'created_at']