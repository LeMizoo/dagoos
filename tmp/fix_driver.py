import json, urllib.request, urllib.error

API = "https://dagoos-api.onrender.com/api"

def req(url, data=None, method="GET", token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# 1. Login
login = req(f"{API}/auth/login", {"email": "admin@dagoos.mg", "password": "admin123"}, method="POST")
token = login["token"]
print("Token OK")

# 2. Trouver le driver à problème
drivers = req(f"{API}/drivers", token=token)
for d in drivers:
    code = d.get("driverCode", "")
    uname = d.get("user", {}).get("name", "")
    if code == "Rakoto André" or uname == "Chauffeur FL-RA-001":
        did = d["id"]
        uid = d["userId"]
        print(f"Driver: {did}, User: {uid}")

        # Corriger le driverCode
        r1 = req(f"{API}/drivers/{did}", {"driverCode": "FL-RA-001"}, method="PUT", token=token)
        print("driverCode corrigé" if r1.get("driverCode") == "FL-RA-001" else r1)

        # Corriger le nom de l'utilisateur
        r2 = req(f"{API}/users/{uid}", {"name": "Rakoto André"}, method="PUT", token=token)
        print("Nom utilisateur corrigé" if r2.get("name") == "Rakoto André" else r2)
        break
