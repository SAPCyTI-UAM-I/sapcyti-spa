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

format_nginx_resolver() {
  case "$1" in
    \[*\]*)
      printf '%s' "$1"
      ;;
    *:*)
      printf '[%s]' "$1"
      ;;
    *)
      printf '%s' "$1"
      ;;
  esac
}

raw_resolvers="${NGINX_RESOLVER:-$(awk '/^nameserver / { print $2 }' /etc/resolv.conf | paste -sd ' ' -)}"
formatted_resolvers=""

for resolver in $raw_resolvers; do
  formatted_resolver="$(format_nginx_resolver "$resolver")"
  if [ -z "$formatted_resolvers" ]; then
    formatted_resolvers="$formatted_resolver"
  else
    formatted_resolvers="$formatted_resolvers $formatted_resolver"
  fi
done

export PORT="${PORT:-80}"
export API_UPSTREAM="${API_UPSTREAM:-http://api:8080}"
export NGINX_RESOLVER="$formatted_resolvers"

if [ -z "$NGINX_RESOLVER" ]; then
  NGINX_RESOLVER="127.0.0.11 1.1.1.1"
  export NGINX_RESOLVER
fi

envsubst '${PORT} ${API_UPSTREAM} ${NGINX_RESOLVER}' < "$template_path" > "$output_path"
