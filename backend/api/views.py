from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from .models import Unit, Resident, Payment
from .serializers import UnitSerializer, ResidentSerializer, PaymentSerializer


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all().order_by("floor", "number")
    serializer_class = UnitSerializer


class ResidentViewSet(viewsets.ModelViewSet):
    queryset = Resident.objects.all().order_by("last_name", "first_name")
    serializer_class = ResidentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by("-due_date")
    serializer_class = PaymentSerializer

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        from django.utils import timezone
        payment = self.get_object()
        payment.status = "paid"
        payment.paid_date = timezone.now().date()
        payment.save()
        return Response(PaymentSerializer(payment).data)


class DashboardStatsView(viewsets.ViewSet):
    def list(self, request):
        total_units = Unit.objects.count()
        occupied_units = Unit.objects.filter(status="occupied").count()
        vacant_units = total_units - occupied_units
        total_residents = Resident.objects.filter(status="active").count()
        pending_payments = Payment.objects.filter(status="pending").count()
        overdue_payments = Payment.objects.filter(status="overdue").count()
        total_collected = Payment.objects.filter(status="paid").aggregate(total=Sum("amount"))["total"] or 0
        total_pending_amount = Payment.objects.filter(status__in=["pending", "overdue"]).aggregate(total=Sum("amount"))["total"] or 0

        return Response({
            "total_units": total_units,
            "occupied_units": occupied_units,
            "vacant_units": vacant_units,
            "total_residents": total_residents,
            "pending_payments": pending_payments,
            "overdue_payments": overdue_payments,
            "total_collected": float(total_collected),
            "total_pending_amount": float(total_pending_amount),
        })
