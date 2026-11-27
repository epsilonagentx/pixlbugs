# The game's own server, `node server.js`, like `npm start`. The game is plain
# JavaScript modules with no build step, so there's a single stage.
FROM node:24-alpine
# Trim the base image to what the server needs, which leaves no OS or npm
# packages with known vulnerabilities in a scan. Node's own bundled libraries
# (OpenSSL and others) aren't in the scan, and change only with a new Node
# release: rebuild the image after each one.
# - apk upgrade: install the fixes Alpine has released.
# - rm: remove npm, Yarn and Corepack, which the server doesn't use, and the
#   base image's entrypoint script, which needs the shell removed below.
# - apk add: keep alpine-baselayout-data, which holds /etc/passwd with the
#   `node` user, when the package that needs it goes below.
# - apk del: remove the package manager and, with it, the system OpenSSL
#   (Node has its own built in), and BusyBox: the shell and basic commands,
#   with a vulnerability that has no fix yet (CVE-2025-60876, in wget). Node
#   runs without a shell. alpine-baselayout goes too, since its install
#   scripts need the shell. This goes last, since it removes `rm` and `sh`.
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules /opt/yarn-* \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg \
           /usr/local/bin/docker-entrypoint.sh \
 && apk add --no-network alpine-baselayout-data \
 && apk del apk-tools ssl_client alpine-baselayout busybox busybox-binsh
WORKDIR /app
# package.json makes Node treat server.js as an ES module.
COPY package.json server.js index.html ./
COPY src ./src
# Standard OCI labels: what the image is and who made it, for
# `docker inspect` and for tools that read them. Here, after the RUN step, a
# change to them doesn't make Docker run apk upgrade again.
LABEL org.opencontainers.image.title="Pixlbugs" \
      org.opencontainers.image.description="A retro shoot-'em-up built with vanilla JavaScript and the Canvas API." \
      org.opencontainers.image.authors="epsilonagentx" \
      org.opencontainers.image.url="https://hub.docker.com/r/epsilonagentx/pixlbugs" \
      org.opencontainers.image.base.name="docker.io/library/node:24-alpine"
ENV HOST=0.0.0.0 PORT=8000
USER node
EXPOSE 8000
# Node itself, in place of the base image's entrypoint script, which needs a
# shell. Arguments to `docker run` replace server.js and go to Node.
ENTRYPOINT ["node"]
CMD ["server.js"]
