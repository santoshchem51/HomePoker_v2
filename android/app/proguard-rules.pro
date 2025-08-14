# PokePot Production ProGuard Rules
# Story 5.4 - Production Deployment Preparation
# Optimized configuration for production builds

# React Native specific rules
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# SQLite and database related classes
-keep class * extends android.database.sqlite.SQLiteOpenHelper { *; }
-keep class * extends android.content.ContentProvider { *; }
-keep class android.database.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Voice recognition
-keep class com.wenkesj.voice.** { *; }

# Crypto-JS
-keep class crypto.** { *; }
-dontwarn crypto.**

# React Native SQLite Storage
-keep class io.liteglue.** { *; }
-keep class org.pgsqlite.** { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# QR Code generation
-keep class com.horcrux.svg.** { *; }

# UUID generation
-keep class java.util.UUID { *; }

# Zustand state management
-keep class zustand.** { *; }

# Performance optimization
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Application-specific rules
-keep class com.pokepot.** { *; }
-keepattributes Signature,RuntimeVisibleAnnotations,AnnotationDefault
