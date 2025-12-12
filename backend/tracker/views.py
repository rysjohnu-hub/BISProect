import datetime

import jwt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Goal, Transaction, User
from .serializers import (CategorySerializerManual, GoalSerializer,
                          TransactionSerializer, UserSerializer)


def is_admin(user):
    """Check if user is admin"""
    return user.is_authenticated and (user.is_admin() or user.is_superuser)


def is_admin(user):
    """Check if user is admin"""
    return user.is_authenticated and (user.is_admin() or user.is_superuser)


class TransactionListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    def post(self, request):
        print("Received transaction data:", request.data)  
        serializer = TransactionSerializer(data=request.data)
        if serializer.is_valid():
            print("Serializer is valid, saving transaction")  
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Serializer errors:", serializer.errors)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransactionDetail(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            transaction = Transaction.objects.get(id=pk, user=request.user)
            serializer = TransactionSerializer(transaction, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Transaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            transaction = Transaction.objects.get(id=pk, user=request.user)
            transaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Transaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class GoalCRUD(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        goals = Goal.objects.filter(user=request.user)
        serializer = GoalSerializer(goals, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GoalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            goal = Goal.objects.get(id=pk, user=request.user)
            goal.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Goal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get_goal(self, pk):
        goal = Goal.objects.get(id=pk)
        return goal

    def put(self, request, pk):
        try:
            goal = Goal.objects.get(id=pk, user=request.user)
            serializer = GoalSerializer(goal, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Goal.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializerManual(categories, many=True)
    return Response(serializer.data)


            
class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(APIView):
    def post(self, request):
        email = request.data['email']
        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed('User not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password!')

        payload = {
            'id': user.id,
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        response = Response()

        response.set_cookie(key='jwt', value=token, httponly=True)
        response.data = {
            'jwt': token
        }
        return response


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Handle password separately if provided
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
                user.save()
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': 'success'
        }
        return response


# Admin Views
class AdminUserList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=pk)
            serializer = UserSerializer(user)
            
            # Get user's goals and transactions
            goals = Goal.objects.filter(user=user)
            transactions = Transaction.objects.filter(user=user)
            
            goals_serializer = GoalSerializer(goals, many=True)
            transactions_serializer = TransactionSerializer(transactions, many=True)
            
            response_data = serializer.data
            response_data['goals'] = goals_serializer.data
            response_data['transactions'] = transactions_serializer.data
            
            return Response(response_data)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=pk)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                # Handle password separately if provided
                if 'password' in request.data and request.data['password']:
                    user.set_password(request.data['password'])
                    user.save()
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=pk)
            # Prevent deleting yourself
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class AdminAllGoals(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        goals = Goal.objects.all()
        serializer = GoalSerializer(goals, many=True)
        return Response(serializer.data)


class AdminAllTransactions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        transactions = Transaction.objects.all()
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)