#!/bin/bash
set -e

echo "Building Go kanji converter..."

cd src/go

# Build for macOS (universal binary for Intel + Apple Silicon)
echo "Building for macOS (universal)..."
GOOS=darwin GOARCH=amd64 go build -o ../../dist/binaries/kanji_converter_amd64 kanji_converter.go
GOOS=darwin GOARCH=arm64 go build -o ../../dist/binaries/kanji_converter_arm64 kanji_converter.go

# Create universal binary using lipo
echo "Creating universal binary..."
lipo -create -output ../../dist/binaries/kanji_converter \
  ../../dist/binaries/kanji_converter_amd64 \
  ../../dist/binaries/kanji_converter_arm64

# Clean up architecture-specific binaries
rm ../../dist/binaries/kanji_converter_amd64
rm ../../dist/binaries/kanji_converter_arm64

# Make executable
chmod +x ../../dist/binaries/kanji_converter

echo "✅ Go binary built successfully"
ls -lh ../../dist/binaries/kanji_converter
