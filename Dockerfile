FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY backend ./backend
COPY Frontend ./Frontend
RUN cd backend && npm run build
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/Frontend ./Frontend
EXPOSE 8000
CMD ["node", "backend/dist/server.js"]
