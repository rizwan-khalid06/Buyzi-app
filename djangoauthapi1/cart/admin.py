from django.contrib import admin
from .models import CartItem

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_product_name', 'quantity', 'added_at')
    search_fields = ('user__email', 'product__name')
    list_filter = ('user', 'added_at')

    def get_product_name(self, obj):
        return obj.product.name
    get_product_name.short_description = 'Product Name'
