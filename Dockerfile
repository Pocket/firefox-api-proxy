FROM node:18-slim@sha256:0a621cdd7d66ad8976f4246ab0661e3b1dd0d397c1dd784ea01bf740bd1c2522

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4028
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD ["npm", "start"]
