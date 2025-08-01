from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'stock', 'category', 'image_preview', 'created_at')
    list_display_links = ('name',)
    list_filter = ('created_at', 'stock', 'category')
    search_fields = ('name', 'description', 'category')
    list_editable = ('stock', 'price', 'category')
    list_per_page = 20
    readonly_fields = ('created_at', 'image_preview')
    actions = ['set_stock_to_10', 'set_stock_to_50', 'clear_stock']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'image', 'image_preview', 'category')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
        }),
    )

    def image_preview(self, obj):
        """Display a thumbnail of the product image in the admin."""
        from django.utils.html import format_html
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "-"
    image_preview.short_description = 'Image Preview'

    def set_stock_to_10(self, request, queryset):
        """Set stock to 10 for selected products."""
        updated = queryset.update(stock=10)
        self.message_user(request, f"Updated stock to 10 for {updated} product(s).")
    set_stock_to_10.short_description = "Set stock to 10"

    def set_stock_to_50(self, request, queryset):
        """Set stock to 50 for selected products."""
        updated = queryset.update(stock=50)
        self.message_user(request, f"Updated stock to 50 for {updated} product(s).")
    set_stock_to_50.short_description = "Set stock to 50"

    def clear_stock(self, request, queryset):
        """Set stock to 0 for selected products."""
        updated = queryset.update(stock=0)
        self.message_user(request, f"Cleared stock (set to 0) for {updated} product(s).")
    clear_stock.short_description = "Clear stock (set to 0)"