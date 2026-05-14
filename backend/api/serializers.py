from rest_framework import serializers
from .models import Unit, Resident, Payment


class UnitSerializer(serializers.ModelSerializer):
    resident_count = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = "__all__"

    def get_resident_count(self, obj):
        return obj.residents.filter(status="active").count()


class ResidentSerializer(serializers.ModelSerializer):
    unit_number = serializers.SerializerMethodField()

    class Meta:
        model = Resident
        fields = "__all__"

    def get_unit_number(self, obj):
        return obj.unit.number if obj.unit else None


class PaymentSerializer(serializers.ModelSerializer):
    resident_name = serializers.SerializerMethodField()
    unit_number = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = "__all__"

    def get_resident_name(self, obj):
        return str(obj.resident)

    def get_unit_number(self, obj):
        return obj.resident.unit.number if obj.resident.unit else None
