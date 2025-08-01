from django.urls import path
from .views import H5ModelPredictionView

urlpatterns = [
    path('predict/', H5ModelPredictionView.as_view(), name='predict'),
]
