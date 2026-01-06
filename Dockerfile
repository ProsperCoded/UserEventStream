# FROM node:18-alpine
FROM node:20-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

# Note: --prefer-offline is for development, should change to --frozen-lockfile for production
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prefer-offline

COPY . .

# Build argument to specify which app to build
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Build the specific application
RUN npx nest build ${APP_NAME} 
# We also need to build the shared library if it's not automatically included by the app build (it usually is via webpack/nest cli)
# But strictly speaking `nest build <app>` should suffice due to monorepo structure.

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main"]
