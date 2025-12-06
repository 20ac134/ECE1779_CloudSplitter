FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production=false
COPY src ./src
ENV API_PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
