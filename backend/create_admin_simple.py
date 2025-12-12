#!/usr/bin/env python
"""
Simple script to create an admin user with predefined values.
Edit the values below and run: python manage.py shell < create_admin_simple.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tracker.models import User

# Edit these values
ADMIN_NAME = "Admin User"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

# Check if user exists
if User.objects.filter(email=ADMIN_EMAIL).exists():
    user = User.objects.get(email=ADMIN_EMAIL)
    user.role = 'admin'
    user.set_password(ADMIN_PASSWORD)
    user.save()
    print(f"User {ADMIN_EMAIL} updated to admin role!")
else:
    # Create new admin user
    user = User.objects.create_user(
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        name=ADMIN_NAME,
        role='admin'
    )
    print(f"Admin user created successfully!")
    print(f"Email: {user.email}")
    print(f"Name: {user.name}")
    print(f"Role: {user.role}")

