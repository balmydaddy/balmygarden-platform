#!/usr/bin/env python3
"""마크다운 표 무결성 검사.

왜 있나: 2026-09-06 `5398f23`과 2026-09-08 두 차례, 표 셀 안의 `|`를
이스케이프하지 않아 행의 칸이 갈라졌다. 둘 다 사람이 눈으로 놓쳤고
LLM이 다시 읽어서 찾았다 — 기계가 셀 수 있는 일에 모델을 쓴 것이다.
(docs/FREE_ALWAYS_ON.md 5절 "LLM에서 빼내기" 후보 2번)

무엇을 보나: 연속한 `|` 시작 줄을 한 표로 묶고, 각 행의 구분자 개수를
헤더 행과 비교한다. 코드스팬(`...`) 안의 `|`와 이스케이프된 `\|`는
구분자가 아니므로 세지 않는다.

한계: 표가 깨졌는지만 본다. 내용이 맞는지는 안 본다.
"""
import json, os, re, subprocess, sys

CODE_SPAN = re.compile(r"`[^`]*`")

def delimiters(line: str) -> int:
    """구분자로 기능하는 | 의 개수."""
    s = CODE_SPAN.sub("", line)        # 코드스팬 제거
    s = s.replace(r"\|", "")           # 이스케이프된 파이프 제거
    return s.count("|")

def scan(path: str):
    """(줄번호, 발견내용) 목록을 돌려준다."""
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().split("\n")
    except (OSError, UnicodeDecodeError):
        return []

    problems, block, fenced = [], [], False
    for n, line in enumerate(lines, 1):
        if line.lstrip().startswith("```"):
            fenced = not fenced
            block = []
            continue
        if fenced:
            continue
        if line.lstrip().startswith("|"):
            block.append((n, line))
            continue
        if block:
            problems += check_block(block)
            block = []
    if block:
        problems += check_block(block)
    return problems

def check_block(block):
    """한 표 안에서 헤더와 칸 수가 다른 행을 찾는다."""
    if len(block) < 2:
        return []                       # 한 줄짜리는 표가 아니다
    header_n, header = block[0]
    expected = delimiters(header)
    out = []
    for n, line in block[1:]:
        got = delimiters(line)
        if got != expected:
            out.append((n, f"칸 구분자 {got}개 (헤더 {header_n}행은 {expected}개)"))
    return out

def changed_md(repo: str):
    """git이 변경으로 보는 .md 파일."""
    try:
        r = subprocess.run(
            ["git", "-C", repo, "status", "--porcelain", "--untracked-files=all"],
            capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return []
    if r.returncode != 0:
        return []
    files = []
    for line in r.stdout.split("\n"):
        name = line[3:].strip()
        if name.endswith(".md"):
            files.append(os.path.join(repo, name))
    return files

def main():
    try:
        json.load(sys.stdin)            # 훅 입력은 읽어서 버린다
    except Exception:
        pass

    repos = [os.getcwd()]
    if os.path.isdir("/workspace/lord-of-dark"):
        repos.append("/workspace/lord-of-dark")

    found = []
    for repo in repos:
        for path in changed_md(repo):
            for n, why in scan(path):
                found.append(f"{path}:{n} — {why}")

    if not found:
        return 0

    print("마크다운 표가 깨졌다. 셀 안의 | 는 \\| 로 이스케이프한다.",
          file=sys.stderr)
    for line in found[:20]:
        print("  " + line, file=sys.stderr)
    if len(found) > 20:
        print(f"  … 외 {len(found) - 20}건", file=sys.stderr)
    return 2                            # 2 = Claude에게 보이는 차단 오류

if __name__ == "__main__":
    sys.exit(main())
