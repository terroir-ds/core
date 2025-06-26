# 1Password Integration Setup

This devcontainer is configured to integrate with 1Password CLI for secure SSH key management and Git signing.

## Prerequisites

1. **1Password Service Account**: Create one at `https://developer.1password.com/docs/service-accounts/`
2. **SSH Keys in 1Password**: Store your SSH keys as "SSH Key" items in 1Password
3. **Local Environment Variables**: Configure your local development environment

## Setup Instructions

### 1. Create a 1Password Service Account

1. Go to `https://developer.1password.com/docs/service-accounts/`
2. Follow the instructions to create a service account
3. Copy the service account token

### 2. Configure Local Environment Variables

Create or update your local `.env` file (NOT committed to git):

```bash
# Required: Your 1Password service account token
OP_SERVICE_ACCOUNT_TOKEN=your-service-account-token-here

# Optional: Your 1Password account identifier (defaults to service account's account)
OP_ACCOUNT=your-account-id

# Optional: Custom names for items in 1Password
GIT_SIGNING_KEY_ITEM=Git Signing Key    # Name of your SSH signing key in 1Password
GIT_CONFIG_ITEM=Git Config              # Name of item containing git user info
```bash
### 3. Store SSH Keys in 1Password

Create SSH Key items in 1Password with these fields:

- **Title**: Give it a meaningful name (e.g., "GitHub SSH Key", "Git Signing Key")
- **Private Key**: Your SSH private key
- **Public Key**: Your SSH public key

The post-create script will automatically find and load these keys.

### 4. (Optional) Store Git Configuration

You can use different 1Password item types for Git configuration:

#### Option A: Identity Item (Recommended)

- Create an Identity item with your first name, last name, and email
- The script will combine first + last name for Git

#### Option B: Secure Note or Custom Item

- Create custom fields:
  - Label: "name" or "full name" - Your Git display name
  - Label: "email" - Your Git email address

## How It Works

When the devcontainer starts, the post-create script will:

1. **Authenticate** with 1Password using your service account token
2. **Start SSH Agent** and load all SSH keys from 1Password
3. **Configure Git Signing** using the first available signing key:
   - Tries keys in this order: `GIT_SIGNING_KEY_ITEM`, "Git Signing Key", "GitHub SSH Key", "Git SSH Key", "SSH Signing Key"
   - Sets up SSH signing format
   - Enables automatic commit and tag signing
   - Creates allowed signers file for verification
4. **Configure Git User** from 1Password (if available)
5. **Install npm dependencies**

## Verification

After the container starts, verify your setup:

```bash
# Check 1Password authentication
op account list

# Check loaded SSH keys
ssh-add -l

# Check Git signing configuration
git config --global --list | grep -E "(gpg|sign)"

# Test a signed commit
git commit --allow-empty -m "Test signed commit"
git log --show-signature -1
```text
## Troubleshooting

### "OP_SERVICE_ACCOUNT_TOKEN environment variable is not set"

- Ensure you've created a `.env` file with your token
- Rebuild the devcontainer after adding the token

### "No SSH keys found in 1Password"

- Verify you have SSH Key items in 1Password
- Check the item category is set to "SSH Key"

### "Failed to authenticate with 1Password"

- Verify your service account token is correct
- Check if the token has expired
- Ensure your 1Password account is accessible

### SSH signing not working

- Ensure your signing key has both private and public key fields
- Try specifying the exact key name via `GIT_SIGNING_KEY_ITEM`
- Check `git log --show-signature` for error messages

## Security Notes

- **Never commit** your `.env` file or service account token
- Service account tokens have limited permissions by design
- SSH keys are only loaded into the container's SSH agent, not written to disk
- The public signing key is saved to `~/.ssh/git_signing_key.pub` for Git's use

## Manual SSH Key Management

If you need to manually manage SSH keys after container creation:

```bash
# Re-run authentication
eval $(op signin)

# Add a specific key
op read "op://Private/Your Key Name/private key" | ssh-add -

# List available SSH keys
op item list --categories "SSH Key"
```
