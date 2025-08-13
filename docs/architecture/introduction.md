# Introduction

## Starter Template or Existing Project

After reviewing the PRD and frontend specification, this is a **monolithic React Native mobile application** with local SQLite storage. Based on the technical assumptions in the PRD:

- **Mobile Framework**: React Native with TypeScript
- **Architecture**: Monolithic mobile (per ADR-001 - Complete Backend Elimination)  
- **Data Storage**: Local SQLite database only (react-native-sqlite-storage)
- **Repository Structure**: Single repository for mobile-only application

This is a **greenfield project** with clear architectural decisions already made. No existing starter templates are mentioned, and the architecture is specifically designed to eliminate backend dependencies for MVP delivery.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-11 | 1.0 | Initial architecture document creation from PRD and frontend spec | Winston (Architect) |

This document outlines the complete fullstack architecture for **PokePot**, including the monolithic mobile application design, local database implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for a mobile-first application where local data management is the primary architectural concern.
