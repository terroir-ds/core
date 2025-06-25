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

# Update NPM
RUN npm install -g npm

# Install global TypeScript and development tools
RUN npm install -g typescript ts-node tsx @types/node npm-check-updates

# Create a non-root user if not exists
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Set the default working directory
WORKDIR /workspaces/core
