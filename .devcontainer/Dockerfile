FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install dependencies for Playwright and browsers
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends \
    # Dependencies for Chromium
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libx264-164 \
    # Dependencies for Firefox
    libgtk-3-0 \
    libxtst6 \
    libavif15 \
    # Dependencies for WebKit
    libwoff1 \
    libopus0 \
    libwebp7 \
    libwebpdemux2 \
    libenchant-2-2 \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libmanette-0.2-0 \
    libgdk-pixbuf2.0-0 \
    libegl1 \
    libnotify4 \
    libxslt1.1 \
    libevent-2.1-7 \
    libgles2 \
    libvpx7 \
    libepoxy0 \
    libgstreamer1.0-0 \
    libgstreamer-gl1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    libgstreamer-plugins-bad1.0-0 \
    libgtk-4-1 \
    libgraphene-1.0-0 \
    libharfbuzz-icu0 \
    flite1-dev \
    libflite1 \
    # Additional tools for development
    jq \
  && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install 1Password CLI
RUN curl -sS https://downloads.1password.com/linux/keys/1password.asc | \
    gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" | \
    tee /etc/apt/sources.list.d/1password.list \
  && mkdir -p /etc/debsig/policies/AC2D62742012EA22/ \
  && curl -sS https://downloads.1password.com/linux/debian/debsig/1password.pol | \
    tee /etc/debsig/policies/AC2D62742012EA22/1password.pol \
  && mkdir -p /usr/share/debsig/keyrings/AC2D62742012EA22 \
  && curl -sS https://downloads.1password.com/linux/keys/1password.asc | \
    gpg --dearmor --output /usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg \
  && apt-get update && apt-get install 1password-cli \
  && apt-get clean -y && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Enable corepack as root (needed for symlinks in /usr/local/bin)
RUN corepack enable

USER $USERNAME

ENV SHELL=/bin/bash
ENV PNPM_HOME=/home/${USERNAME}/.local/share/pnpm
ENV PATH=${PNPM_HOME}:$PATH

# Prepare pnpm as node user
RUN corepack prepare pnpm@10.12.3 --activate \
  && pnpm setup

# Note: Playwright browsers will be installed via postCreateCommand
# to avoid bloating the image size
