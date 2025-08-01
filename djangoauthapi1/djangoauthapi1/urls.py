from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/user/', include('account.urls')),
    path('api/products/', include('product.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('order.urls')),
    path('api/favourite/', include('favourite.urls')),  # Added favourite app URLs
    path('api/', include('modelapi.urls')),
    path('api/', include('voicesearch.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)