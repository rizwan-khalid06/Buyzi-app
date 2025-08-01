from django.urls import path
from .views import ProductListCreateView, ProductRetrieveUpdateDestroyView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:id>/', ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),
]