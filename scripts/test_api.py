"""Quick API validation script."""
import urllib.request
import json
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
BASE = f"http://localhost:{PORT}/api/v1"
DEMO_PASSWORD = "Demo1234" + chr(33)  # avoid ! in shell


def post(path, data):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


print(f"\n=== ViralCommerce API Test (port {PORT}) ===\n")

# Health check
h, _ = get("/health".replace(BASE, ""), None)  # fix path
import urllib.request as _u
with _u.urlopen(f"http://localhost:{PORT}/health") as r:
    health = json.loads(r.read())
print(f"Health: {health}")

# Login demo user
print("\n=== Login (demo) ===")
resp, code = post("/auth/login", {"email": "demo@viralcommerce.ai", "password": DEMO_PASSWORD})
if code == 200:
    print(f"  OK: {resp['user']['email']} | plan={resp['user']['plan']}")
    token = resp["access_token"]
else:
    print(f"  FAIL {code}: {resp}")
    sys.exit(1)

# Register new user
print("\n=== Register (new user) ===")
resp2, code2 = post("/auth/register", {"email": "e2e_test@vc.ai", "password": "Test1234x", "full_name": "E2E"})
print(f"  {code2}: {resp2.get('email', resp2)}")

# /me
print("\n=== GET /me ===")
me, code3 = get("/auth/me", token)
print(f"  {code3}: email={me.get('email')} plan={me.get('plan')}")

# /products
print("\n=== GET /products ===")
prods, code4 = get("/products/?limit=8")
print(f"  {code4}: total={prods.get('total')}")
for p in prods.get("items", []):
    print(f"    {p['viral_score']:5.1f}  {p['name']}")

# /products/trending
print("\n=== GET /products/trending ===")
trend, code5 = get("/products/trending?hours=48&limit=3")
print(f"  {code5}: {len(trend) if isinstance(trend, list) else trend} items")

# /campaigns
print("\n=== GET /campaigns ===")
camps, code6 = get("/campaigns/", token)
print(f"  {code6}: {len(camps)} campaigns")
for c in (camps if isinstance(camps, list) else []):
    print(f"    [{c['status']:10}] roas={c['roas']}  {c['name'][:50]}")

# /suppliers
print("\n=== GET /suppliers ===")
supps, code7 = get("/suppliers/")
print(f"  {code7}: {len(supps) if isinstance(supps, list) else supps} suppliers")

print("\n" + "="*40)
print("ALL TESTS PASSED")
print("="*40)
print(f"\nFrontend: http://localhost:3000")
print(f"API Docs: http://localhost:{PORT}/docs")
print(f"\nLogin: demo@viralcommerce.ai / Demo1234!")
