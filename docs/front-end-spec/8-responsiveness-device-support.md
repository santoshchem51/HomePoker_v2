# 8. Responsiveness & Device Support

## 8.1 Device Support Matrix

| Device Type | Primary Support | Orientation | Special Considerations |
|-------------|----------------|-------------|----------------------|
| Phone (5.4"-6.7") | Primary target | Portrait preferred | One-handed operation, voice-first |
| Phone (6.7"+) | Full support | Portrait/Landscape | Enhanced visibility, dual-thumb use |
| Tablet (9"-11") | Secondary support | Landscape preferred | Multi-player view, organizer device |
| Tablet (12"+) | Basic support | Landscape only | Group management, presentation mode |

## 8.2 Breakpoint Strategy

```css
/* Mobile-first responsive design */
.container {
  /* Phone portrait (default) */
  padding: var(--spacing-base);
  max-width: 100%;
}

/* Large phones */
@media (min-width: 414px) {
  .container {
    padding: var(--spacing-lg);
  }
  
  .touch-target {
    min-height: var(--spacing-comfortable); /* 88px */
  }
}

/* Tablets landscape */
@media (min-width: 768px) and (orientation: landscape) {
  .poker-table {
    transform: scale(1.2);
    justify-content: space-around;
  }
  
  .player-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## 8.3 Performance Optimization

**React Native Optimizations:**
- `FlatList` for large transaction lists with `getItemLayout`
- `useMemo` for expensive settlement calculations  
- `useCallback` for event handlers to prevent re-renders
- `Image` optimization with `resizeMode` and caching

**SQLite Performance:**
- WAL mode for concurrent read/write operations
- Proper indexing on frequently queried columns
- Connection pooling for multiple simultaneous operations
- Query optimization with EXPLAIN analysis
