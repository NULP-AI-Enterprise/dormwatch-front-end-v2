# Stage 1: deps
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2: builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: runner
FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf.tmpl
COPY docker-entrypoint-nginx.sh /docker-entrypoint-nginx.sh
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint-nginx.sh
EXPOSE 80
CMD ["/docker-entrypoint-nginx.sh"]
