FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Build argument to specify which app to build
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Build the specific application
RUN npx nest build ${APP_NAME} 
# We also need to build the shared library if it's not automatically included by the app build (it usually is via webpack/nest cli)
# But strictly speaking `nest build <app>` should suffice due to monorepo structure.

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main"]
