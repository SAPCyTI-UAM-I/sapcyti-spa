#!/bin/sh
set -eu

template_path="/etc/nginx/templates-spa/default.conf.template"
output_path="/etc/nginx/conf.d/default.conf"

if [ ! -f "$template_path" ]; then
  exit 0
fi

if ! sh -c "cat > '$output_path' </dev/null" 2>/dev/null; then
  echo "SAPCyTI nginx config: keeping externally mounted $output_path"
  exit 0
fi

export PORT="${PORT:-80}"
export API_UPSTREAM="${API_UPSTREAM:-http://api:8080}"
export NGINX_RESOLVER="${NGINX_RESOLVER:-$(awk '/^nameserver / { print $2 }' /etc/resolv.conf | paste -sd ' ' -)}"

if [ -z "$NGINX_RESOLVER" ]; then
  NGINX_RESOLVER="127.0.0.11 1.1.1.1"
  export NGINX_RESOLVER
fi

envsubst '${PORT} ${API_UPSTREAM} ${NGINX_RESOLVER}' < "$template_path" > "$output_path"
