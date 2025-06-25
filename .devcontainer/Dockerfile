FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install additional dependencies for Playwright and Chrome
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#   && apt-get -y install --no-install-recommends \
#     # Additional tools for development
#   && apt-get clean -y && rm -rf /var/lib/apt/lists/*

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

# Prepare pnpm and install global tools as node user
RUN corepack prepare pnpm@10.12.3 --activate \
  && pnpm setup \
  && pnpm add -g typescript ts-node tsx @types/node npm-check-updates

WORKDIR /workspaces/core
