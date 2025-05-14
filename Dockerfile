FROM node:22-alpine AS base
WORKDIR /usr/app

FROM base AS build

COPY package*.json .npmrc ./
RUN npm ci
COPY . ./
RUN npm run build
RUN npm prune --omit=dev

FROM base

COPY --from=build /usr/app/node_modules/ ./node_modules/
COPY --from=build /usr/app/build/ ./src/
COPY --from=build /usr/app/prisma/ ./prisma/
COPY --from=build /usr/app/web/ ./web/

EXPOSE 80
CMD [ "node", "--unhandled-rejections=strict", "/usr/app/src/index.js" ]
