from django.urls import path
from .views import ToggleFavouriteView, FavouriteListView

urlpatterns = [
    path('toggle/<int:product_id>/', ToggleFavouriteView.as_view(), name='toggle-favourite'),
    path('', FavouriteListView.as_view(), name='list-favourites'),
]