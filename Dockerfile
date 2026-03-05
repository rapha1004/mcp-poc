FROM node:22-alpine AS base

WORKDIR /app
COPY . .
RUN npm i
CMD ["npm", "start"]