from rest_framework import serializers
from .models import Category, Transaction, Goal
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        # Don't update password here, it's handled in the view
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class CategorySerializerManual(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=100)



class TransactionSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%Y-%m-%d', input_formats=['%Y-%m-%d'])
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


