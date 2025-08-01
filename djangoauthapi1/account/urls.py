
from django.urls import path,include
from account.views import UserRegistration,UserLoginView,UserProfileView,UserChangePassword,SendPasswordResetEmailView,UserPasswordResetView


urlpatterns = [
    path("register/",UserRegistration.as_view(),name="register"),
    path("login/",UserLoginView.as_view(),name="login"),
    path("profile/",UserProfileView.as_view(),name="profile"),
    path("changePassword/",UserChangePassword.as_view(),name="changePassword"),
    path("resetPassword/",SendPasswordResetEmailView.as_view(),name='resetPassword'),
    path('resetPassword/<uid>/<token>/',UserPasswordResetView.as_view(),name='resetPassword')


]
