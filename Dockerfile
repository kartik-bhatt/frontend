# Stage 1: Build the app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the app using nginx
FROM nginx:alpine

# Copy the Vite build output to nginx's web directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional, if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8086
CMD ["nginx", "-g", "daemon off;"]
