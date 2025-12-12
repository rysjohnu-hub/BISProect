from django.urls import path
from rest_framework_simplejwt.views import (TokenObtainPairView,
                                            TokenRefreshView)

from .views import *

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login', LoginView.as_view()),
    path('user', UserView.as_view()),
    path('logout', LogoutView.as_view()),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('categories/', category_list, name='category-list'),
    path('transactions/', TransactionListCreate.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', TransactionDetail.as_view(), name='transaction-detail'),
    path('goals/', GoalCRUD.as_view(), name='goal-crud'),
    path('goals/<int:pk>/', GoalCRUD.as_view(), name='goal-crud'),
    
    # Admin routes
    path('admin/users/', AdminUserList.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetail.as_view(), name='admin-user-detail'),
    path('admin/goals/', AdminAllGoals.as_view(), name='admin-all-goals'),
    path('admin/transactions/', AdminAllTransactions.as_view(), name='admin-all-transactions'),

]
