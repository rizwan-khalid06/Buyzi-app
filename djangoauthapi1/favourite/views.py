# favourite/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from product.models import Product
from favourite.models import Favourite
from product.serializers import ProductSerializer

class ToggleFavouriteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        fav, created = Favourite.objects.get_or_create(user=request.user, product=product)

        if not created:
            fav.delete()
            return Response({'status': 'removed from favourites', 'is_favourite': False}, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'added to favourites', 'is_favourite': True}, status=status.HTTP_201_CREATED)

class FavouriteListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(favourite__user=self.request.user)