#!/usr/bin/env python3
# check-api.py - Vérification de l'API sans jq

import json
import os
import subprocess
import sys

def run_curl(url, method='GET', data=None, headers=None):
    """Exécute une requête curl et retourne la réponse"""
    cmd = ['curl', '-s']
    
    if method == 'POST':
        cmd.append('-X')
        cmd.append('POST')
    
    if headers:
        for key, value in headers.items():
            cmd.append('-H')
            cmd.append(f'{key}: {value}')
    
    if data:
        cmd.append('-d')
        cmd.append(json.dumps(data))
        cmd.append('-H')
        cmd.append('Content-Type: application/json')
    
    cmd.append(url)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if result.stdout:
            return json.loads(result.stdout)
        return None
    except json.JSONDecodeError:
        print(f"❌ Erreur: Réponse non JSON reçue")
        print(f"Réponse: {result.stdout[:200]}...")
        return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def main():
    print("🔍 VÉRIFICATION DE L'API DAGOOS")
    print("=" * 40)
    
    # 1. Vérifier les URLs
    print("\n📡 VÉRIFICATION DES SERVICES:")
    urls = [
        ("https://dago-mobility.vercel.app/login", "Page Login"),
        ("https://dago-mobility.vercel.app/dashboard", "Dashboard"),
        ("https://dago-mobility.vercel.app/fleet", "Fleet"),
        ("https://dagoos-api.onrender.com/health", "API Health"),
    ]
    
    for url, name in urls:
        cmd = ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', url]
        result = subprocess.run(cmd, capture_output=True, text=True)
        status = result.stdout.strip()
        if status in ['200', '302', '307']:
            print(f"✅ {name}: {status}")
        else:
            print(f"❌ {name}: {status}")
    
    # 2. Test de login
    print("\n🔐 TEST DE CONNEXION:")
    
    test_users = [
        (
            os.getenv("DAGOOS_CHECK_ADMIN_EMAIL"),
            os.getenv("DAGOOS_CHECK_ADMIN_PASSWORD"),
            "Super Admin",
        ),
        (
            os.getenv("DAGOOS_CHECK_FLEET_EMAIL"),
            os.getenv("DAGOOS_CHECK_FLEET_PASSWORD"),
            "Fleet Manager",
        ),
        (
            os.getenv("DAGOOS_CHECK_COOP_EMAIL"),
            os.getenv("DAGOOS_CHECK_COOP_PASSWORD"),
            "Coop Manager",
        ),
    ]

    for email, password, role in test_users:
        if not email or not password:
            print(f"⏭️ {role}: credentials absents des variables d'environnement")
            continue

        print(f"\n📝 {role}: {email}")
        response = run_curl(
            'https://dagoos-api.onrender.com/api/auth/login',
            method='POST',
            data={'email': email, 'password': password}
        )
        
        if response and 'token' in response:
            token = response['token']
            print(f"✅ Connexion réussie")
            print(f"   Token: {token[:30]}...")
            
            # Tester une route protégée
            headers = {'Authorization': f'Bearer {token}'}
            protected = run_curl(
                'https://dagoos-api.onrender.com/api/drivers',
                headers=headers
            )
            
            if protected and 'data' in protected:
                print(f"   ✅ Route /api/drivers accessible")
                if 'data' in protected and protected['data']:
                    print(f"   📊 {len(protected['data'])} conducteurs trouvés")
            else:
                print(f"   ❌ Route /api/drivers inaccessible")
                if protected and 'message' in protected:
                    print(f"   Message: {protected['message']}")
        else:
            print(f"❌ Échec de connexion")
            if response and 'message' in response:
                print(f"   Message: {response['message']}")
    
    # 3. Vérification des fichiers
    print("\n📁 VÉRIFICATION DES FICHIERS:")
    files = [
        '/d/Dagoos/admin-next/lib/api.js',
        '/d/Dagoos/admin-next/lib/auth.js',
        '/d/Dagoos/admin-next/pages/_app.js',
        '/d/Dagoos/admin-next/pages/login.js',
        '/d/Dagoos/admin-next/pages/api/proxy/[...path].js',
    ]
    
    for filepath in files:
        if os.path.exists(filepath):
            print(f"✅ {os.path.basename(filepath)}")
        else:
            print(f"❌ {os.path.basename(filepath)} - MANQUANT")
    
    print("\n✅ VÉRIFICATION TERMINÉE")

if __name__ == "__main__":
    main()
