import hashlib

def hash_password(raw: str) -> str:
    # demo: passlib/argon2 tốt hơn, nhưng tạm SHA256 để dev nhanh
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
