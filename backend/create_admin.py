#!/usr/bin/env python
"""
Script to create an admin user.
Usage: python manage.py shell < create_admin.py
Or run: python create_admin.py (after setting up Django environment)
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tracker.models import User

def create_admin_user():
    print("Creating admin user...")
    
    # Get user input
    name = input("Enter admin name: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"User with email {email} already exists!")
        update = input("Do you want to update this user to admin? (y/n): ")
        if update.lower() == 'y':
            user = User.objects.get(email=email)
            user.role = 'admin'
            user.set_password(password)
            user.save()
            print(f"User {email} has been updated to admin role!")
        else:
            print("Operation cancelled.")
        return
    
    # Create new admin user
    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        role='admin'
    )
    
    print(f"Admin user created successfully!")
    print(f"Email: {user.email}")
    print(f"Name: {user.name}")
    print(f"Role: {user.role}")

if __name__ == '__main__':
    create_admin_user()

