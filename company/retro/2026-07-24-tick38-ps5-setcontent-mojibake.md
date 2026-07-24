# PS 5.1 Get-Content/Set-Content corrupts UTF-8 assignment files (near-miss, tick #38)

**What happened.** The tick #38 dispatcher flipped four assignment files to
`status: in_progress` with a PowerShell one-liner: `(Get-Content <file> -Raw) -replace
'status: open','status: in_progress' | Set-Content <file> -Encoding utf8`. On Windows
PowerShell 5.1, `Get-Content` without an encoding read the UTF-8 files as ANSI, so every
em-dash and accented character was double-encoded on write ("—" became "â€""), and
`Set-Content -Encoding utf8` added a BOM. The one-line status flip became an 18-line diff
per file of silent mojibake.

**Why it almost shipped.** The change *looked* right in the terminal (statuses did flip)
and the commit was one keystroke away. It was caught only because the dispatcher noticed
`git diff --stat` reporting ~72 changed lines for what should have been 4, and inspected
an actual diff before committing.

**Lesson for any company on Windows.** Never round-trip UTF-8 repo files through
PS 5.1 `Get-Content`/`Set-Content`. Use a byte-safe editor (the harness Edit tool, or
`git`-aware tooling) for surgical edits — the dispatcher's own claim commits included.
And treat a diff-stat that is larger than the intended change as a stop signal, not
noise: the mismatch between "what I meant to change" and "what changed" is the cheapest
corruption detector available, and it works on any file type.

**Standing practice adopted here.** Status flips and ledger edits go through the Edit
tool; any shell-side file write specifies encoding end-to-end or doesn't happen. A
diff-stat check before every claim commit is already implicit in "commit by explicit
path" — this incident makes the *size* of the stat part of what gets checked.
