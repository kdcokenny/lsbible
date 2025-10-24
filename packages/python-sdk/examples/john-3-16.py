"""Example: Fetch John 3:16 from the LSBible API."""

from lsbible import LSBibleClient, BookName

with LSBibleClient() as client:
    passage = client.get_verse(BookName.JOHN, 3, 16)

    print(f"Title: {passage.title}")
    print(f"Reference: {passage.from_ref}")
    print(f"Single verse: {passage.is_single_verse}")
    print()

    for verse in passage.verses:
        print(f"Verse {verse.verse_number}:")
        print(f"Plain text: {verse.plain_text}")
        print()
        print("Segments with formatting:")
        for i, seg in enumerate(verse.segments, 1):
            flags = []
            if seg.is_red_letter:
                flags.append("red-letter")
            if seg.is_italic:
                flags.append("italic")
            if seg.is_bold:
                flags.append("bold")
            if seg.is_small_caps:
                flags.append("small-caps")
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            print(f'  {i}. "{seg.text}"{flag_str}')
