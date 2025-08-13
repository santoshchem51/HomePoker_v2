# 1. Introduction

## UX Goals & Design Philosophy
PokePot embraces a **"game night companion"** design philosophy - creating an interface that feels like a helpful friend handling tedious calculations while staying invisible during actual poker play. The monolithic mobile architecture enables **instant offline performance** with local SQLite storage, eliminating network dependencies that could disrupt gameplay.

The design prioritizes a **party atmosphere** that amplifies the social entertainment of poker nights, while maintaining **mobile-first simplicity** for effortless interaction during gameplay. Every interaction is optimized for **performance** through local-first data management and **social-centric** features that seamlessly integrate with existing WhatsApp group dynamics.

## Primary User Personas
1. **Game Organizer** - Creates sessions, manages player roster, handles final settlements
2. **Active Player** - Records buy-ins/cash-outs via voice or touch during gameplay  
3. **Early Leaver** - Needs instant cash-out calculations for mid-game departures

## Core Design Principles  
- **Voice-First, Touch-Secondary**: Primary interactions through hands-free voice commands with visual confirmations
- **Party Celebration Focus**: Every successful transaction includes delightful micro-celebrations
- **Poker Room Optimized**: Dark mode default, large touch targets (88x88pt minimum), high contrast for dim lighting
- **Mathematical Certainty**: Every calculation transparent, verifiable, dispute-proof
- **Social Integration**: Seamless WhatsApp sharing with pre-formatted, mobile-optimized settlement messages
- **Performance-Optimized**: Local SQLite operations complete within 100ms for instant responsiveness
