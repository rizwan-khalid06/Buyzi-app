from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# Register your models here.
from account.models import User
class UserModalAdmin(BaseUserAdmin):
   

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserModalAdmin
    # that reference specific fields on auth.User.
    list_display = ["id","email", "name","tc", "is_admin"]
    list_filter = ["is_admin"]
    fieldsets = [
        ('UserCredentials', {"fields": ["email", "password"]}),
        ("Personal info", {"fields": ["name","tc"]}),
        ("Permissions", {"fields": ["is_admin"]}),
    ]
    # add_fieldsets is not a standard ModelAdmin attribute. UserModalAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "name","tc", "password1", "password2"],
            },
        ),
    ]
    search_fields = ["email"]
    ordering = ["email","id"]
    filter_horizontal = []


# Now register the new UserModalAdmin...
admin.site.register(User, UserModalAdmin)
 