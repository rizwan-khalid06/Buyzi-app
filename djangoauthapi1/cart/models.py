# cart/models.py
from django.db import models
from django.conf import settings
from product.models import Product

class CartItem(models.Model):
    # Link the cart to the user who owns it
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    # Link to a product
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    # How many units of the product
    quantity = models.PositiveIntegerField(default=1)

    # New fields for color and size
    color = models.CharField(max_length=50, blank=True, null=True)
    size = models.CharField(max_length=10, blank=True, null=True)

    # Auto timestamp for tracking when it was added
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product', 'color', 'size')  # Updated to include color and size

    def __str__(self):
        return f"{self.quantity} x {self.product.name} ({self.color}, {self.size}) (User: {self.user.email})"