# cart/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import CartItem
from .serializers import CartItemSerializer

class CartItemListCreateView(generics.ListCreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        color = serializer.validated_data['color']
        size = serializer.validated_data['size']

        # Check stock availability
        if product.stock < quantity:
            raise ValidationError({"error": "Insufficient stock"})

        # Check for existing cart item with same product, color, and size
        existing_item = CartItem.objects.filter(
            user=self.request.user,
            product=product,
            color=color,
            size=size
        ).first()

        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if product.stock < new_quantity:
                raise ValidationError({"error": "Insufficient stock"})
            existing_item.quantity = new_quantity
            existing_item.save()
            self._updated_instance = existing_item
            self._response_status = status.HTTP_200_OK
        else:
            serializer.save(user=self.request.user)
            self._updated_instance = serializer.instance
            self._response_status = status.HTTP_201_CREATED

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        instance = getattr(self, '_updated_instance', serializer.instance)
        serializer = self.get_serializer(instance)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=getattr(self, '_response_status', status.HTTP_201_CREATED), headers=headers)

class CartItemUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        quantity = serializer.validated_data.get('quantity', instance.quantity)
        if instance.product.stock < quantity:
            raise ValidationError({"error": "Insufficient stock"})
        serializer.save()