"""Run with: python manage.py shell < seed_data.py"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "condominums_backend.settings")
django.setup()

from datetime import date, timedelta
from api.models import Unit, Resident, Payment

Unit.objects.all().delete()
Resident.objects.all().delete()
Payment.objects.all().delete()

units = [
    Unit(number="101", floor=1, unit_type="1br", size_sqft=650, monthly_fee=1200, status="occupied"),
    Unit(number="102", floor=1, unit_type="2br", size_sqft=900, monthly_fee=1600, status="occupied"),
    Unit(number="103", floor=1, unit_type="studio", size_sqft=450, monthly_fee=950, status="vacant"),
    Unit(number="201", floor=2, unit_type="2br", size_sqft=950, monthly_fee=1700, status="occupied"),
    Unit(number="202", floor=2, unit_type="3br", size_sqft=1200, monthly_fee=2100, status="vacant"),
    Unit(number="301", floor=3, unit_type="3br", size_sqft=1250, monthly_fee=2200, status="occupied"),
]
for u in units:
    u.save()

residents = [
    Resident(unit=units[0], first_name="Alice", last_name="Johnson", email="alice@example.com", phone="555-1001", move_in_date=date(2023, 1, 15)),
    Resident(unit=units[1], first_name="Bob", last_name="Smith", email="bob@example.com", phone="555-1002", move_in_date=date(2022, 6, 1)),
    Resident(unit=units[3], first_name="Carol", last_name="Davis", email="carol@example.com", phone="555-1003", move_in_date=date(2023, 9, 1)),
    Resident(unit=units[5], first_name="David", last_name="Martinez", email="david@example.com", phone="555-1004", move_in_date=date(2021, 3, 20)),
]
for r in residents:
    r.save()

today = date.today()
payments = [
    Payment(resident=residents[0], payment_type="monthly_fee", amount=1200, due_date=today.replace(day=1), status="paid", paid_date=today - timedelta(days=5)),
    Payment(resident=residents[0], payment_type="monthly_fee", amount=1200, due_date=(today - timedelta(days=30)).replace(day=1), status="paid", paid_date=today - timedelta(days=35)),
    Payment(resident=residents[1], payment_type="monthly_fee", amount=1600, due_date=today.replace(day=1), status="pending"),
    Payment(resident=residents[1], payment_type="late_fee", amount=50, due_date=today - timedelta(days=10), status="overdue"),
    Payment(resident=residents[2], payment_type="monthly_fee", amount=1700, due_date=today.replace(day=1), status="paid", paid_date=today - timedelta(days=2)),
    Payment(resident=residents[3], payment_type="monthly_fee", amount=2200, due_date=today.replace(day=1), status="pending"),
    Payment(resident=residents[3], payment_type="special_assessment", amount=500, due_date=today + timedelta(days=15), status="pending"),
]
for p in payments:
    p.save()

print("Seed data created successfully!")
print(f"  {Unit.objects.count()} units")
print(f"  {Resident.objects.count()} residents")
print(f"  {Payment.objects.count()} payments")
