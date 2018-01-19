WAV=$(shell find . -name '*.wav' -maxdepth 1 | sed 's/ /\\ /g')
OGG=$(WAV:.wav=.ogg)

.SECONDEXPANSION:
%.ogg: $$(wildcard %.wav)
	ffmpeg -i "$*.wav" -b:a 96k -acodec libopus -f ogg "$@"

all: $(OGG)
