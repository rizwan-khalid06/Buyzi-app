# cart/urls.py
from django.urls import path
from .views import CartItemListCreateView, CartItemUpdateDeleteView

urlpatterns = [
    path('', CartItemListCreateView.as_view(), name='cart-list-create'),  # GET all cart items, POST new item
    path('<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-update-delete'),  # GET, PUT, PATCH, DELETE specific item
]