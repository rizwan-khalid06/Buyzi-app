from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Favourite

@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):

    search_fields = ('user__username', 'product__name')
