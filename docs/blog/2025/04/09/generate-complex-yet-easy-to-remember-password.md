---
date: 2025-04-09
---

# Generate a complex yet easy-to-remember password

Today I reset the login password for a colleague and told her the newly generated password, but even after several attempts, the system kept saying it was incorrect. 


I tried the new password myself and was able to log in successfully. then I realized that the generated password was too complex to input and remember.

so I decided to update the code to generate a new,random, and less complex password. There’s no way I’m writing the code myself — I let Gemini do it for me.

Here is my new code written in Golang. This Go program generates “human-friendly” but complex passwords, combining positive, memorable words with random characters (digit, special char, uppercase, etc.)

## a demo

```go
package main

import (
	"fmt"
	"math/rand"
	"strings" // Import the strings package
	"time"
)

var (
	//积极阳光词汇，包括短词
	positiveWords = []string{
		"s", "se", "sec", "secu", "secur", "securi", "security", "sun", "sky", "joy", "go", "win", "yes", "hug", "up", "fun", "fly", "run",
		"bright", "smile", "hope", "trust", "peace", "light", "dream", "goal",
		"cheer", "grow", "warm", "grace", "magic", "brave", "fresh", "sunny",
		"love", "kind", "shine", "energy", "faith", "zest", "clear",
	}

	safeSpecialChars = []rune("!@%*()-_=+")
)

// Use a package-level RNG instance to avoid global lock contention
// if this were used concurrently (though not strictly necessary for this example).
// Still seeded once.
var globalRand *rand.Rand

func init() {
	// Seed a source specific to our package
	source := rand.NewSource(time.Now().UnixNano())
	globalRand = rand.New(source)
}

func getRandomWord() string {
	return positiveWords[globalRand.Intn(len(positiveWords))]
}

func getRandomLowercaseLetter() rune {
	return rune('a' + globalRand.Intn(26))
}

func getRandomUppercaseLetter() rune {
	return rune('A' + globalRand.Intn(26))
}

func getRandomDigit() rune {
	return rune('0' + globalRand.Intn(10))
}

func getRandomSpecialChar() rune {
	return safeSpecialChars[globalRand.Intn(len(safeSpecialChars))]
}

// 主函数：根据长度生成易记且复杂的密码 (Optimized Version)
func generatePassword(length int) string {
	if length < 4 {
		length = 4 // Ensure minimum length for required chars
	}

	var sb strings.Builder
	// Pre-allocate roughly the needed capacity for slight performance gain
	sb.Grow(length)

	// Target length for words, leaving space for required characters
	wordTargetLen := length - 3
	if wordTargetLen < 0 {
		wordTargetLen = 0 // Handle cases where length is exactly 4
	}

	// Fill with words as much as possible
	for sb.Len() < wordTargetLen {
		word := getRandomWord()
		// Check if adding the word would exceed the target length for words
		if sb.Len()+len(word) <= wordTargetLen {
			sb.WriteString(word)
		} else {
			// If the first word is already too long, break
			// Otherwise, try smaller words next time (or break if loop condition fails)
			if sb.Len() == 0 && len(word) > wordTargetLen {
				break
			}
			// Optional: Could try getting another, potentially shorter word,
			// but breaking is simpler and often sufficient.
			break
		}
	}

	// Insert necessary elements
	// Check current length before adding required elements
	requiredElementsAdded := 0
	if sb.Len() < length {
		sb.WriteRune(getRandomDigit())
		requiredElementsAdded++
	}
	if sb.Len() < length {
		sb.WriteRune(getRandomSpecialChar())
		requiredElementsAdded++
	}
	if sb.Len() < length {
		sb.WriteRune(getRandomUppercaseLetter())
		requiredElementsAdded++
	}


	// Fill remaining length with lowercase letters
	for sb.Len() < length {
		sb.WriteRune(getRandomLowercaseLetter())
	}

	// Shuffling (Fisher-Yates) - If you uncomment this, do it *before* sb.String()
	// runes := []rune(sb.String()) // Convert builder content to runes *once*
	// globalRand.Shuffle(len(runes), func(i, j int) {
	// 	runes[i], runes[j] = runes[j], runes[i]
	// })
	// return string(runes) // Return shuffled string

	// Return final string from builder (if not shuffling)
	return sb.String()
}


func main() {
	for i := 0; i <= 10; i++ { // Reduced loop count for brevity
		pass := generatePassword(12)
		fmt.Printf("Length %2d → %s\n", 12, pass)
		pass = generatePassword(4)
		fmt.Printf("Length %2d → %s\n", 4, pass)
		pass = generatePassword(20)
		fmt.Printf("Length %2d → %s\n", 20, pass)
		fmt.Println("---")
	}
}
```


## how to use more words 

The best practice is to use positiveWords.txt to store as many words as possible and make it available as a Go package. Here is an example:

```go
// Package passgen provides functions to generate memorable, complex passwords.
package passgen

import (
	"bufio"
	"bytes"
	_ "embed" // Import the embed package
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"
)

//go:embed positiveWords.txt
var positiveWordsBytes []byte // Embed the file content

var (
	positiveWords []string
	safeSpecialChars = []rune("!@%*()-_=+")
)

var globalRand *rand.Rand

func init() {
	source := rand.NewSource(time.Now().UnixNano())
	globalRand = rand.New(source)

	loadedWords, err := loadWordsFromBytes(positiveWordsBytes)
	if err != nil {
		log.Fatalf("passgen: Failed to initialize positive words from embedded data: %v", err)
	}
	if len(loadedWords) == 0 {
		log.Fatalf("passgen: Failed to initialize positive words: no words loaded from embedded positiveWords.txt")
	}
	positiveWords = loadedWords
}

// Helper function to load words from an embedded byte slice
func loadWordsFromBytes(data []byte) ([]string, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("embedded word data is empty")
	}
	var words []string
	reader := bytes.NewReader(data)
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		word := strings.TrimSpace(line)
		if word != "" {
			words = append(words, strings.ToLower(word))
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error scanning embedded word data: %w", err)
	}
	return words, nil
}


// --- Public API Function ---

// GeneratePassword creates a memorable, complex password of the specified length.
// It includes positive words separated by hyphens (if multiple words fit),
// followed by at least one digit, one special character, and one uppercase letter.
// The remainder is filled with lowercase letters. The final character order is NOT randomized.
// The minimum length is 4. Lengths less than 4 will be treated as 4.
// It is safe for concurrent use.
func GeneratePassword(length int) string {
	if length < 4 {
		length = 4
	}

	var sb strings.Builder
	sb.Grow(length)

	// Reserve space for the 3 required non-word characters
	wordTargetLen := length - 3
	if wordTargetLen < 0 {
		wordTargetLen = 0
	}

	// Fill with words, adding hyphens between them
	if wordTargetLen > 0 && len(positiveWords) > 0 {
		for { // Loop indefinitely until we break
			word := getRandomWord()
			wordLen := len(word)
			hyphenLen := 0

			// Determine if a hyphen is needed (if builder already has content)
			if sb.Len() > 0 {
				hyphenLen = 1 // Need space for '-'
			}

			// Check if the next word (and hyphen if needed) fits
			if sb.Len()+hyphenLen+wordLen <= wordTargetLen {
				// Add hyphen if this isn't the first word
				if hyphenLen > 0 {
					sb.WriteRune('-')
				}
				sb.WriteString(word)
			} else {
				// Word doesn't fit (or wordTargetLen was 0), break the loop
				break
			}

            // If we've reached or exceeded the target, stop adding words
            // (Handles cases where wordTargetLen is exactly filled)
            if sb.Len() >= wordTargetLen {
                break
            }
		}
	}

	// Define the required characters (order is now fixed)
	needed := []func() rune{
		getRandomDigit,
		getRandomSpecialChar,
		getRandomUppercaseLetter,
	}
	// -- REMOVED: Shuffling of needed elements --
	// globalRand.Shuffle(len(needed), func(i, j int) {
	// 	needed[i], needed[j] = needed[j], needed[i]
	// })

	// Add required elements in their defined order
	for _, getCharFunc := range needed {
		// Only add if we haven't reached the total desired length yet
		if sb.Len() < length {
			sb.WriteRune(getCharFunc())
		}
	}

	// Fill any remaining length with lowercase letters
	for sb.Len() < length {
		sb.WriteRune(getRandomLowercaseLetter())
	}

	// -- REMOVED: Final shuffling of the password --
	// runes := []rune(sb.String())
	// globalRand.Shuffle(len(runes), func(i, j int) {
	// 	runes[i], runes[j] = runes[j], runes[i]
	// })
	// return string(runes)

	// Return the constructed string directly
	return sb.String()
}

// --- Internal Helper Functions (Unexported) ---

func getRandomWord() string {
	if len(positiveWords) == 0 {
		return "secure" // Fallback
	}
	return positiveWords[globalRand.Intn(len(positiveWords))]
}

func getRandomLowercaseLetter() rune {
	return rune('a' + globalRand.Intn(26))
}

func getRandomUppercaseLetter() rune {
	return rune('A' + globalRand.Intn(26))
}

func getRandomDigit() rune {
	return rune('0' + globalRand.Intn(10))
}

func getRandomSpecialChar() rune {
	return safeSpecialChars[globalRand.Intn(len(safeSpecialChars))]
}
```