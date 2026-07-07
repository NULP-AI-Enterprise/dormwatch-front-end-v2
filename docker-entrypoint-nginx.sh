#!/bin/sh
set -e
RESOLVER=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -1)
sed "s|__RESOLVER__|${RESOLVER}|g" /etc/nginx/conf.d/default.conf.tmpl \
    > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
