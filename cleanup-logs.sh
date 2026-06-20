#!/bin/bash
# ============================================================
# 日志清理脚本 — 仅保留最近 7 天的日志
# 用法: ./cleanup-logs.sh [--dry-run]
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DAYS=7
DRY_RUN=false

# 检查参数
if [ "$1" = "--dry-run" ] || [ "$1" = "-n" ]; then
    DRY_RUN=true
    echo "🔍 试运行模式 — 不会实际删除文件"
fi

# 项目中的日志目录列表
LOG_DIRS=(
    "$SCRIPT_DIR/blog/logs"
    "$SCRIPT_DIR/blog/api/logs"
    "$SCRIPT_DIR/blog/api/app-data/logs"
    "$SCRIPT_DIR/zhuye/logs"
)

TOTAL_DELETED=0
TOTAL_SIZE=0

echo "========================================"
echo "  日志清理 — 保留最近 ${DAYS} 天"
echo "  运行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

for LOG_DIR in "${LOG_DIRS[@]}"; do
    if [ ! -d "$LOG_DIR" ]; then
        echo "⏭  跳过（目录不存在）: $LOG_DIR"
        continue
    fi

    echo "📁 扫描: $LOG_DIR"

    # 查找超过 7 天的 .log 文件
    while IFS= read -r -d '' file; do
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
        age=$(find "$file" -mtime +${DAYS} 2>/dev/null | wc -l)

        if [ "$DRY_RUN" = true ]; then
            echo "   [试运行] 将删除: $(basename "$file") ($(numfmt --to=iec $size 2>/dev/null || echo ${size}B))"
        else
            rm -f "$file"
            echo "   🗑  已删除: $(basename "$file") ($(numfmt --to=iec $size 2>/dev/null || echo ${size}B))"
        fi

        TOTAL_DELETED=$((TOTAL_DELETED + 1))
        TOTAL_SIZE=$((TOTAL_SIZE + size))
    done < <(find "$LOG_DIR" -type f -name "*.log" -mtime +${DAYS} -print0 2>/dev/null)

    # 清理空目录
    find "$LOG_DIR" -type d -empty -delete 2>/dev/null || true

done

echo ""
echo "========================================"
if [ "$DRY_RUN" = true ]; then
    echo "  试运行结束，将删除 $TOTAL_DELETED 个文件"
else
    echo "  清理完成"
    echo "  删除文件: $TOTAL_DELETED 个"
    echo "  释放空间: $(numfmt --to=iec $TOTAL_SIZE 2>/dev/null || echo ${TOTAL_SIZE}B)"
fi
echo "========================================"