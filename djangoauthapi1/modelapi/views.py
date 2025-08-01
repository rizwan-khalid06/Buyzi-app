from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
import tensorflow as tf
from PIL import Image
import numpy as np
import os
from django.conf import settings
import logging

# Imports for product querying
from product.models import Product
from product.serializers import ProductSerializer

logger = logging.getLogger(__name__)

# Define class names to match frontend expectations
CLASS_NAMES = ['balletflat', 'Boat', 'Brogue', 'Clog', 'Sneaker']

# Confidence threshold for predictions
CONFIDENCE_THRESHOLD = 0.65

class H5ModelPredictionView(APIView):
    parser_classes = [MultiPartParser]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        try:
            model_path = os.path.join(settings.BASE_DIR, 'modelapi', 'model', 'thezaack.h5')
            logger.info(f"Loading model from: {model_path}")
            self.model = tf.keras.models.load_model(model_path, compile=False)
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None

    def post(self, request, *args, **kwargs):
        if not self.model:
            logger.error("Model is not loaded.")
            return Response({'error': 'Model not loaded'}, status=500)

        image_file = request.FILES.get('image')
        if not image_file:
            logger.error("No image file found in request.")
            return Response({'error': 'No image provided'}, status=400)

        try:
            logger.info(f"Received image: {image_file.name}, size: {image_file.size}")

            # Preprocess image
            image = Image.open(image_file).convert('RGB')
            image = image.resize((224, 224))
            image_array = np.array(image) / 255.0
            image_array = np.expand_dims(image_array, axis=0)

            logger.info("Preprocessed image. Starting prediction...")

            # Make prediction
            predictions = self.model.predict(image_array)
            predicted_index = int(np.argmax(predictions[0]))
            max_confidence = float(np.max(predictions[0]))
            logger.info(f"Raw prediction output: {predictions}")
            logger.info(f"Predicted index: {predicted_index}, Confidence: {max_confidence}")

            # Check confidence threshold
            if max_confidence < CONFIDENCE_THRESHOLD:
                logger.warning(f"Prediction confidence {max_confidence} below threshold {CONFIDENCE_THRESHOLD}")
                return Response({
                    'error': 'No products found: Image does not match any known category',
                    'class_name': None,
                    'confidence': max_confidence,
                    'products': []
                }, status=200)  # Use 200 to align with "no products found" case

            if predicted_index < 0 or predicted_index >= len(CLASS_NAMES):
                logger.error(f"Predicted index {predicted_index} out of range.")
                return Response({'error': 'Prediction index out of range'}, status=500)

            predicted_class = CLASS_NAMES[predicted_index]
            logger.info(f"Predicted class: {predicted_class}")

            # Map predicted class to Product model category (uppercase with underscore)
            predicted_category_enum = predicted_class.upper().replace(' ', '_')

            # Fetch matching products
            try:
                products = Product.objects.filter(category=predicted_category_enum)
                logger.info(f"Found {products.count()} products for category: {predicted_category_enum}")
                if products.count() == 0:
                    logger.info(f"No products found for category: {predicted_category_enum}")
                    return Response({
                        'error': f'No products found for category {predicted_class}',
                        'class_name': predicted_class,
                        'confidence': max_confidence,
                        'products': []
                    }, status=200)  # Use 200 to indicate successful prediction but no products

                serialized_products = ProductSerializer(products, many=True, context={'request': request}).data
            except Exception as e:
                logger.error(f"Error fetching products: {e}")
                serialized_products = []

            return Response({
                'class_name': predicted_class,  # Frontend expects lowercase (e.g., 'balletflat')
                'confidence': max_confidence,    # Include confidence in response for transparency
                'products': serialized_products
            })

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return Response({'error': f'Prediction failed: {str(e)}'}, status=500)