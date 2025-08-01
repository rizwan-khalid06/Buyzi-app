from rest_framework import serializers
from product.models import Product
from favourite.models import Favourite

class ProductSerializer(serializers.ModelSerializer):
    is_favourite = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'description', 'is_favourite', 'image', 'stock', 'category']

    def get_is_favourite(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Favourite.objects.filter(user=user, product=obj).exists()
        return False