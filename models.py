from sqlalchemy import ForeignKey, String, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(unique=True)

class Company(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_telegram_id: Mapped[int]
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    free_until: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow() + timedelta(days=5))
    specialists_count: Mapped[int] = mapped_column(default=1)  # текущий тариф
    paid_until: Mapped[datetime] = mapped_column(nullable=True)

class Specialist(Base):
    __tablename__ = "specialists"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str]
    surname: Mapped[str]
    photo_file_id: Mapped[str] = mapped_column(nullable=True)

class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str]

class ServiceSpecialist(Base):  # связь услуг и специалистов
    __tablename__ = "service_specialist"
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), primary_key=True)
    specialist_id: Mapped[int] = mapped_column(ForeignKey("specialists.id"), primary_key=True)

class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int]
    specialist_id: Mapped[int]
    service_id: Mapped[int]
    client_telegram_id: Mapped[int]
    datetime: Mapped[datetime]
    confirmed: Mapped[bool] = mapped_column(default=False)

class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"))
    text: Mapped[str] = mapped_column(Text)
    rating: Mapped[int]
