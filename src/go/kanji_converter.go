package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/ikawaha/kagome-dict/ipa"
	"github.com/ikawaha/kagome/v2/tokenizer"
)

// katakanaToHiragana converts katakana characters to hiragana
func katakanaToHiragana(s string) string {
	var result strings.Builder
	for _, r := range s {
		// Katakana range: U+30A0 to U+30FF
		// Hiragana range: U+3040 to U+309F
		// Offset: 0x60
		if r >= '\u30A0' && r <= '\u30FF' {
			result.WriteRune(r - 0x60)
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// convertToHiragana processes text and converts kanji to hiragana using Kagome
func convertToHiragana(text string) (string, error) {
	// Initialize Kagome tokenizer with IPA dictionary
	t, err := tokenizer.New(ipa.Dict(), tokenizer.OmitBosEos())
	if err != nil {
		return "", fmt.Errorf("failed to initialize tokenizer: %w", err)
	}

	// Tokenize input text
	tokens := t.Tokenize(text)

	var result strings.Builder
	for _, token := range tokens {
		features := token.Features()
		surface := token.Surface

		// features[7] contains the reading in katakana (for IPA dictionary)
		if len(features) > 7 && features[7] != "*" {
			reading := features[7]
			// Convert katakana reading to hiragana
			hiragana := katakanaToHiragana(reading)
			result.WriteString(hiragana)
		} else if surface != "" {
			// Keep original text if no reading available
			result.WriteString(surface)
		}
	}

	return result.String(), nil
}

func main() {
	// Read all input from stdin
	reader := bufio.NewReader(os.Stdin)
	var inputBuilder strings.Builder

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				if line != "" {
					inputBuilder.WriteString(line)
				}
				break
			}
			fmt.Fprintf(os.Stderr, "Error reading input: %v\n", err)
			os.Exit(1)
		}
		inputBuilder.WriteString(line)
	}

	inputText := inputBuilder.String()

	if strings.TrimSpace(inputText) == "" {
		fmt.Fprintln(os.Stderr, "Error: No input text provided")
		os.Exit(1)
	}

	// Convert kanji to hiragana
	output, err := convertToHiragana(inputText)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	// Write result to stdout
	fmt.Print(output)
	os.Exit(0)
}
