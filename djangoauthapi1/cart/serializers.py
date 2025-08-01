from rest_framework import serializers
from .models import CartItem
from product.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    image = serializers.ImageField(source='product.image', use_url=True, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_price', 'image', 'quantity', 'color', 'size', 'added_at']
        read_only_fields = ['id', 'product_name', 'product_price', 'image', 'added_at']

    def validate(self, data):
        # Check if this is an update (PATCH) or create (POST)
        is_update = self.instance is not None  # instance exists for updates

        if not is_update:  # For create (POST), enforce color and size
            if not data.get('color'):
                raise serializers.ValidationError({"color": "Color is required."})
            if not data.get('size'):
                raise serializers.ValidationError({"size": "Size is required."})
        else:  # For update (PATCH), allow color and size to be optional
            if 'color' in data and not data.get('color'):
                raise serializers.ValidationError({"color": "Color cannot be empty."})
            if 'size' in data and not data.get('size'):
                raise serializers.ValidationError({"size": "Size cannot be empty."})

        return data