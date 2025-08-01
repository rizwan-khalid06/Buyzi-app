from django.contrib import admin
from .models import Order, OrderItem

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'shipping_address', 'city', 'postal_code', 'country', 'created_at')
    list_filter = ('created_at', 'country')
    search_fields = ('user__email', 'shipping_address', 'city', 'postal_code', 'country')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'color', 'size', 'price')
    list_filter = ('order',)
    search_fields = ('product__name', 'color', 'size')
    ordering = ('order',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'product')