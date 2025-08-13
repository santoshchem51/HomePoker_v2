#!/bin/bash

# Sound type parameter (default: "default")
SOUND_TYPE="${1:-default}"

# Visual notification
echo "🔔 === NOTIFICATION: Task Complete! === 🔔"

case "$SOUND_TYPE" in
    "default"|"beep")
        # Windows default beep
        powershell.exe -Command "[System.Media.SystemSounds]::Beep.Play()" 2>/dev/null
        ;;
    "asterisk")
        # Asterisk sound (info/alert)
        powershell.exe -Command "[System.Media.SystemSounds]::Asterisk.Play()" 2>/dev/null
        ;;
    "exclamation")
        # Exclamation sound (warning)
        powershell.exe -Command "[System.Media.SystemSounds]::Exclamation.Play()" 2>/dev/null
        ;;
    "hand")
        # Hand/Stop sound (error)
        powershell.exe -Command "[System.Media.SystemSounds]::Hand.Play()" 2>/dev/null
        ;;
    "question")
        # Question sound
        powershell.exe -Command "[System.Media.SystemSounds]::Question.Play()" 2>/dev/null
        ;;
    "chime")
        # Windows notification chime
        powershell.exe -Command "[console]::beep(500,300); [console]::beep(600,300)" 2>/dev/null
        ;;
    "double")
        # Double beep
        powershell.exe -Command "[console]::beep(800,200); Start-Sleep -Milliseconds 100; [console]::beep(800,200)" 2>/dev/null
        ;;
    "triple")
        # Triple beep (ascending)
        powershell.exe -Command "[console]::beep(400,200); [console]::beep(500,200); [console]::beep(600,200)" 2>/dev/null
        ;;
    "long")
        # Long beep
        powershell.exe -Command "[console]::beep(440,1000)" 2>/dev/null
        ;;
    "success")
        # Success sound (ascending notes)
        powershell.exe -Command "[console]::beep(523,200); [console]::beep(659,200); [console]::beep(784,400)" 2>/dev/null
        ;;
    "error")
        # Error sound (descending notes)
        powershell.exe -Command "[console]::beep(784,200); [console]::beep(659,200); [console]::beep(523,400)" 2>/dev/null
        ;;
    "mario")
        # Mario coin sound
        powershell.exe -Command "[console]::beep(988,100); [console]::beep(1319,600)" 2>/dev/null
        ;;
    "test")
        # Test all sounds
        echo "Testing all notification sounds..."
        for sound in beep asterisk exclamation hand question chime double triple success error mario; do
            echo "Playing: $sound"
            $0 $sound
            sleep 1
        done
        ;;
    *)
        echo "Available sounds: beep, asterisk, exclamation, hand, question, chime, double, triple, long, success, error, mario, test"
        echo "Usage: $0 [sound_type]"
        ;;
esac