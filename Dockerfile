FROM node:18-slim@sha256:a7423cbf419ccea2723be0af141b663b643c30bea56d19bf2e8fe171e904fde9

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4028
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD ["npm", "start"]
