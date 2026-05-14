from django.db import models


class Unit(models.Model):
    UNIT_TYPES = [
        ("studio", "Studio"),
        ("1br", "1 Bedroom"),
        ("2br", "2 Bedrooms"),
        ("3br", "3 Bedrooms"),
    ]
    STATUS_CHOICES = [
        ("vacant", "Vacant"),
        ("occupied", "Occupied"),
    ]

    number = models.CharField(max_length=20, unique=True)
    floor = models.PositiveIntegerField()
    unit_type = models.CharField(max_length=10, choices=UNIT_TYPES)
    size_sqft = models.PositiveIntegerField()
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="vacant")

    def __str__(self):
        return f"Unit {self.number}"


class Resident(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name="residents")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    move_in_date = models.DateField()
    move_out_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Payment(models.Model):
    PAYMENT_TYPES = [
        ("monthly_fee", "Monthly Fee"),
        ("special_assessment", "Special Assessment"),
        ("late_fee", "Late Fee"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
    ]

    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="payments")
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default="monthly_fee")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.resident} - {self.payment_type} ({self.due_date})"
