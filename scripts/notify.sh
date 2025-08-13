#!/bin/bash

# Terminal bell notification
echo -e "\a"

# Optional: Add visual notification in terminal
echo "🔔 === NOTIFICATION: Task Complete! === 🔔"

# If you have Ubuntu desktop notifications enabled
if command -v notify-send &> /dev/null; then
    notify-send "Claude Code" "Task completed - your input needed" 2>/dev/null
fi

# Alternative: Use printf for better compatibility
printf "\a"