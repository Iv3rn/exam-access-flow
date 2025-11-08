#!/bin/bash

echo "🔑 Gerando chaves JWT para Supabase"
echo "===================================="

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Function to generate JWT token
generate_jwt() {
    local role=$1
    local secret=$2
    
    # Header
    header='{"alg":"HS256","typ":"JWT"}'
    header_b64=$(echo -n "$header" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    # Payload
    payload="{\"iss\":\"supabase\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000)),\"role\":\"$role\"}"
    payload_b64=$(echo -n "$payload" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    # Signature
    signature=$(echo -n "${header_b64}.${payload_b64}" | openssl dgst -sha256 -hmac "$secret" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    echo "${header_b64}.${payload_b64}.${signature}"
}

# Generate keys
ANON_KEY=$(generate_jwt "anon" "$JWT_SECRET")
SERVICE_ROLE_KEY=$(generate_jwt "service_role" "$JWT_SECRET")

echo ""
echo "✅ Chaves geradas com sucesso!"
echo ""
echo "Adicione estas variáveis ao seu arquivo .env:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "ANON_KEY=$ANON_KEY"
echo ""
echo "SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo ""
echo "⚠️  IMPORTANTE: Guarde estas chaves em local seguro!"
