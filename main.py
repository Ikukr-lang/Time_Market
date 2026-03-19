# ... (всё предыдущее остаётся) ...

# Временное хранилище (потом заменить на БД)
companies = {}          # company_id → data
company_counter = 1

user_companies = {}     # telegram_id → list[company_ids]

# ── API ──

async def api_create_company(request):
    data = await request.json()
    init_data = data.get("initData")
    user = validate_init_data(init_data)
    if not user:
        return web.json_response({"error": "Не авторизован"}, status=403)

    global company_counter
    company_id = company_counter
    company_counter += 1

    companies[company_id] = {
        "id": company_id,
        "owner_id": user["id"],
        "name": data.get("name", "Без названия"),
        "photo": data.get("photo", None),
        "description": data.get("description", ""),
        "address": data.get("address", ""),
        "specialists": [],
        "services": [],
    }

    if user["id"] not in user_companies:
        user_companies[user["id"]] = []
    user_companies[user["id"]].append(company_id)

    return web.json_response({"success": True, "company_id": company_id})

async def api_my_companies(request):
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    if not user:
        return web.json_response({"companies": []})

    my_ids = user_companies.get(user["id"], [])
    my_list = [companies.get(cid, {}) for cid in my_ids]
    return web.json_response({"companies": my_list})

async def api_company_details(request):
    company_id = request.match_info.get("id")
    try:
        cid = int(company_id)
        comp = companies.get(cid, {})
        return web.json_response(comp)
    except:
        return web.json_response({"error": "Компания не найдена"}, status=404)

async def api_add_specialist(request):
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    if not user:
        return web.json_response({"error": "Не авторизован"}, status=403)

    cid = data.get("company_id")
    if cid not in companies or companies[cid]["owner_id"] != user["id"]:
        return web.json_response({"error": "Нет доступа"}, status=403)

    specialist = {
        "name": data.get("name"),
        "surname": data.get("surname"),
        "photo": data.get("photo"),
    }
    companies[cid]["specialists"].append(specialist)
    return web.json_response({"success": True})

# Добавь аналогично для услуг и слотов календаря

# В create_app() добавь новые роуты:
app.router.add_post("/api/create_company", api_create_company)
app.router.add_post("/api/add_specialist", api_add_specialist)
app.router.add_post("/api/my_companies", api_my_companies)
app.router.add_get("/api/company/{id}", api_company_details)

# Новый роут для публичной страницы компании
@aiohttp_jinja2.template("company.html")
async def company_page(request):
    company_id = request.match_info.get("id")
    try:
        cid = int(company_id)
        comp = companies.get(cid, {})
        return {"company": comp, "base_url": BASE_URL}
    except:
        return {"company": {}}
    
app.router.add_get("/company/{id}", company_page)
