from django.db import models

class Product(models.Model):
    # Category choices
    CATEGORY_CHOICES = [
    ('balletflat', 'balletflat'),
    ('BOAT', 'Boat'),
    ('BROGUE', 'Brogue'),
    ('CLOG', 'Clog'),
    ('SNEAKER', 'Sneaker'),
]


    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(null=True, blank=True)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name