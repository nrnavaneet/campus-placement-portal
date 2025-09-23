#!/usr/bin/env python3
"""
Remove emojis followed by exactly one space from all files in the project.
Skips venv, __pycache__, .git, and node_modules directories.
"""

import os
import re
from pathlib import Path


def get_emoji_pattern():
    """Return compiled regex pattern for emojis followed by exactly one space."""
    emoji_pattern = (
        r"(["
        r"\U0001F600-\U0001F64F"  # emoticons
        r"\U0001F300-\U0001F5FF"  # symbols & pictographs
        r"\U0001F680-\U0001F6FF"  # transport & map
        r"\U0001F1E0-\U0001F1FF"  # flags
        r"\U00002600-\U000026FF"  # misc symbols
        r"\U00002700-\U000027BF"  # dingbats
        r"\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
        r"\U0001FA70-\U0001FAFF"  # extended pictographs
        r"]\uFE0F?) "  # allow optional variation selector before space
    )
    return re.compile(emoji_pattern, flags=re.UNICODE)


def find_files(root_dir):
    """Find all files under root_dir, skipping common directories."""
    files = []
    root_path = Path(root_dir)
    for file_path in root_path.rglob("*"):
        if file_path.is_file() and not any(
            part in file_path.parts
            for part in ["venv", "__pycache__", ".git", "node_modules"]
        ):
            files.append(str(file_path))
    return sorted(files)


def remove_emojis_from_file(file_path, emoji_pattern):
    """Remove emojis from a single file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        matches = list(emoji_pattern.finditer(content))
        if matches:
            for match in matches:
                print(f"Removed: {repr(match.group(0))} from {file_path}")
            new_content = emoji_pattern.sub("", content)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"File changed: {file_path}")
        else:
            print(f"No emoji+space found in: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")


def main():
    emoji_pattern = get_emoji_pattern()
    all_files = find_files(".")
    print(f"Found {len(all_files)} files.")
    for file_path in all_files:
        remove_emojis_from_file(file_path, emoji_pattern)


if __name__ == "__main__":
    main()
