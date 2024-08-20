# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app
ARG PORT
ENV PORT=$PORT
# install dependencies into temp directory
# this will cache them and speed up future builds

COPY package.json bun.lockb /usr/src/app/

COPY src /usr/src/app/src
COPY cert /usr/src/app/cert
RUN bun i --production --frozen-lockfile

# run the app
USER root
EXPOSE $PORT/tcp
ENTRYPOINT [ "bun", "run", "app" ]