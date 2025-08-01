from django.db import models
from django.conf import settings  # Import settings to access AUTH_USER_MODEL
from product.models import Product  # update this import if your Product model is elsewhere

class Favourite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Using custom user model from settings
        on_delete=models.CASCADE,
        verbose_name="user"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name="product"
    )

    class Meta:
        unique_together = ('user', 'product')  # ensures one favorite per user-product
        verbose_name = "favorite"
        verbose_name_plural = "favorites"

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"  
