from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer
from cart.models import CartItem
from .utils import send_order_confirmation_whatsapp
from datetime import datetime

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user
        cart_items = CartItem.objects.filter(user=user)

        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save the order
        order = serializer.save(user=user)

        # Save each cart item into the order
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                color=item.color,
                size=item.size,
                price=item.product.price
            )

        # Clear the cart
        cart_items.delete()

        # Trigger WhatsApp message using phone number from request
        phone_number = request.data.get("phone")
        if not phone_number:
            return Response({"error": "Phone number is required for confirmation message"}, status=400)

        # Format phone number for WhatsApp (ensure it starts with '+' and country code)
        if not phone_number.startswith('+'):
            phone_number = f"+{phone_number}"

        whatsapp_result = send_order_confirmation_whatsapp(phone_number, order.id)

        # Response
        response_data = serializer.data
        response_data["whatsapp_status"] = whatsapp_result
        print(f"Sending WhatsApp confirmation to: {phone_number} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        return Response(response_data, status=status.HTTP_201_CREATED)