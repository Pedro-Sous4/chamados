# Stage 1: Build Frontend
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve Backend + Static
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY server_prod.js ./
COPY src/data/colaboradores.json ./src/data/
COPY public/figurinhas ./public/figurinhas

# Serve static files from express
EXPOSE 3001
CMD ["node", "server_prod.js"]
