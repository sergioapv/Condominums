from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UnitViewSet, ResidentViewSet, PaymentViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r"units", UnitViewSet)
router.register(r"residents", ResidentViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"dashboard", DashboardStatsView, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
]
