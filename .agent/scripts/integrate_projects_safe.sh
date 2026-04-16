#!/bin/bash

# .agent/scripts/integrate_projects_safe.sh
# Script para integrar agentes do Antigravity Kit em subprojetos de forma segura.
#
# Uso: ./integrate_projects_safe.sh <caminho_absoluto_do_projeto_alvo>
# Exemplo: ./integrate_projects_safe.sh /home/igor/antigravity/Legendarios-V2

set -e

PROJECT_PATH="$1"
ANTIGRAVITY_ROOT="/home/igor/antigravity"
SOURCE_AGENT="$ANTIGRAVITY_ROOT/.agent"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "$PROJECT_PATH" ]; then
  log_error "Por favor, forneça o caminho do projeto alvo."
  echo "Uso: $0 <caminho_absoluto_do_projeto_alvo>"
  exit 1
fi

if [ ! -d "$PROJECT_PATH" ]; then
  log_error "Diretório do projeto não encontrado: $PROJECT_PATH"
  exit 1
fi

TARGET_AGENT="$PROJECT_PATH/.agent"

log_info "Iniciando integração segura para: $PROJECT_PATH"

# 1. Backup
if [ -d "$TARGET_AGENT" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR="${TARGET_AGENT}_backup_${TIMESTAMP}"
  log_info "Criando backup de .agent em: $BACKUP_DIR"
  cp -r "$TARGET_AGENT" "$BACKUP_DIR"
else
  log_info "Diretório .agent não existe no alvo. Criando..."
  mkdir -p "$TARGET_AGENT"
fi

# 2. Criar estrutura de diretórios se não existir
DIRS=("agents" "skills" "rules" "scripts" "workflows")

for dir in "${DIRS[@]}"; do
  # Se diretório não existe, cria
  if [ ! -d "$TARGET_AGENT/$dir" ]; then
    mkdir -p "$TARGET_AGENT/$dir"
    log_info "Criado diretório: $TARGET_AGENT/$dir"
  fi
done

# 3. Symlinks Granulares (Merge)
create_symlinks() {
  local type="$1"
  local source_dir="$SOURCE_AGENT/$type" # .agent original
  local target_dir="$TARGET_AGENT/$type" # .agent do projeto

  log_info " --- Processando $type ---"

  if [ ! -d "$source_dir" ]; then
    log_warn "Diretório fonte não encontrado: $source_dir. Pulando."
    return
  fi

  # Se o diretório alvo não existir (caso raro, pois criamos acima), cria
  if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
  fi

  # Itera sobre arquivos e diretórios na origem
  # shopt -s nullglob para evitar erro se pasta vazia
  shopt -s nullglob
  for item in "$source_dir"/*; do
    basename=$(basename "$item")
    target_item="$target_dir/$basename"

    if [ -e "$target_item" ] || [ -L "$target_item" ]; then
      # Item já existe no destino.
      # Se for symlink apontando para o mesmo lugar, ok.
      # Se for arquivo real, mantemos (preservação).
      log_warn "Mantido existente: $basename"
    else
      # Item não existe, criamos symlink
      ln -s "$item" "$target_item"
      log_info "Link criado: $basename -> $(readlink -f $item)"
    fi
  done
  shopt -u nullglob
}

for dir in "${DIRS[@]}"; do
  create_symlinks "$dir"
done

# 4. GEMINI.md
SOURCE_GEMINI="$ANTIGRAVITY_ROOT/GEMINI.md"
TARGET_GEMINI="$PROJECT_PATH/GEMINI.md"

if [ -f "$SOURCE_GEMINI" ]; then
  if [ -e "$TARGET_GEMINI" ]; then
    log_warn "GEMINI.md já existe no destino. Preservando."
    
    # Criar referência global
    GLOBAL_REF="$PROJECT_PATH/GEMINI_GLOBAL_REFERENCE.md"
    if [ ! -e "$GLOBAL_REF" ]; then
      ln -s "$SOURCE_GEMINI" "$GLOBAL_REF"
      log_info "Criado GEMINI_GLOBAL_REFERENCE.md apontando para o global."
    else
      log_info "GEMINI_GLOBAL_REFERENCE.md já existe."
    fi
    
  else
    ln -s "$SOURCE_GEMINI" "$TARGET_GEMINI"
    log_info "Link criado para GEMINI.md"
  fi
else
  log_error "GEMINI.md não encontrado na raiz do Antigravity."
fi

log_info "Integração concluída com sucesso para $PROJECT_PATH!"
