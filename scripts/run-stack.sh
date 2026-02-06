#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v tput >/dev/null 2>&1; then
  green=$(tput setaf 2); red=$(tput setaf 1); yellow=$(tput setaf 3); bold=$(tput bold); reset=$(tput sgr0)
else
  green=""; red=""; yellow=""; bold=""; reset=""
fi

say() { echo "${bold}$1${reset}"; }
ok() { echo "${green}$1${reset}"; }
fail() { echo "${red}$1${reset}"; }
warn() { echo "${yellow}$1${reset}"; }

say "1) Running unit tests..."
if pnpm exec jest --passWithNoTests; then
  ok "Tests passed"
else
  fail "Tests failed"; exit 1
fi

say "2) Building..."
if pnpm run build; then
  ok "Build succeeded"
else
  fail "Build failed"; exit 1
fi

say "3) Starting dev server... (Ctrl+C to stop)"
pnpm run dev
