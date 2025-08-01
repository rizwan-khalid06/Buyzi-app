import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import speech_recognition as sr

class VoiceSearchView(APIView):
    def post(self, request):
        try:
            audio_file = request.FILES.get('audio')
            if not audio_file:
                return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)

            # Save the uploaded file temporarily
            temp_file_path = f'temp_audio_{audio_file.name}'
            with open(temp_file_path, 'wb') as f:
                for chunk in audio_file.chunks():
                    f.write(chunk)

            recognizer = sr.Recognizer()

            # Use speech_recognition to process the audio file
            with sr.AudioFile(temp_file_path) as source:
                audio_data = recognizer.record(source)

            # Recognize speech using Google's free API
            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                return Response({'error': 'Could not understand audio'}, status=status.HTTP_400_BAD_REQUEST)
            except sr.RequestError as e:
                return Response({'error': f'Speech recognition service error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Clean up temp file
            os.remove(temp_file_path)

            # Return the recognized text
            return Response({'transcribed_text': text}, status=status.HTTP_200_OK)

        except Exception as e:
            # Remove temp file if exists in case of error
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
