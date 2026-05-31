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

envsubst '${PORT} ${API_UPSTREAM}' < "$template_path" > "$output_path"
