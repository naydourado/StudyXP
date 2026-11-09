# gera valores novos para SECRET_KEY e HUMOR_ENC_KEY
# uso: python scripts/gerar_chaves.py  (copie a saida para o seu .env)
import secrets

from cryptography.fernet import Fernet

print(f"SECRET_KEY={secrets.token_urlsafe(64)}")
print(f"HUMOR_ENC_KEY={Fernet.generate_key().decode()}")
