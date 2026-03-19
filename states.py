from aiogram.fsm.state import State, StatesGroup

class CompanyCreation(StatesGroup):
    name = State()

class AddSpecialist(StatesGroup):
    name = State()
    surname = State()
    photo = State()

class AddService(StatesGroup):
    name = State()

class BookingFlow(StatesGroup):
    choose_company = State()
    choose_service = State()
    choose_specialist = State()
    choose_date = State()
    choose_time = State()
