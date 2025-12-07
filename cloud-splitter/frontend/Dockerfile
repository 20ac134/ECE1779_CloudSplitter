FROM node:20-alpine AS build
WORKDIR /usr/src/app

ARG APP_VERSION=dev
LABEL app.version=$APP_VERSION

COPY package.json .
RUN npm config set fetch-retries 5 \
 && npm config set fetch-timeout 600000 \
 && npm install --no-audit --no-fund

COPY . .
ARG VITE_API_ORIGIN
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}
RUN chmod +x node_modules/.bin/vite && npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
