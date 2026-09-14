#!/usr/bin/env python3
"""시크릿 노출 검사.

왜 있나: CLAUDE.md 금지 행동에 `.env.local` 커밋 금지가 있지만, 그걸
**확인하는 절차가 없었다.** 이번 주에만 IG_ACCESS_TOKEN·UNITY_LICENSE·
GEMINI_API_KEY 세 종류의 시크릿을 다루는 코드를 건드렸고, 외부 노출
경로(앱인토스·인스타 게시)가 늘고 있다.

CEO가 공유한 agency-agents의 "AI-Generated Code Security Auditor"를
페르소나가 아니라 훅으로 받은 것이다. 매번 모델을 띄워 눈으로 보게
하는 대신 기계가 문자열을 세게 한다 — LLM 호출 0회, 비용 0,
무엇을 왜 잡았는지가 정규식에 그대로 남아 감사가 된다.
(docs/FREE_ALWAYS_ON.md 5절 "LLM에서 빼내기"와 같은 계열)

무엇을 보나: git이 변경으로 보는 텍스트 파일에서 다섯 가지.
  1. 알려진 토큰 접두사 (sk-, ghp_, AKIA, xoxb-, AIza …)
  2. 개인키 블록 (-----BEGIN ... PRIVATE KEY-----)
  3. Authorization: Bearer 뒤의 긴 리터럴
  4. 시크릿 이름에 긴 문자열 리터럴을 직접 대입
  5. 시크릿 환경변수를 로그·출력에 그대로 흘림

한계: 문자열 모양만 본다. 값이 진짜 살아 있는 키인지, 이미 폐기된
값인지는 모른다. 반대로 짧거나 평범하게 생긴 시크릿은 못 잡는다 —
이 훅이 조용하다고 안전하다는 뜻이 아니다.
"""
import json, os, re, subprocess, sys

# 이 훅 자신과 문서는 예로 든 패턴 때문에 자기를 잡는다. 제외한다.
SELF = os.path.basename(__file__)
SKIP_NAMES = {SELF, "package-lock.json", "yarn.lock", "pnpm-lock.yaml"}
SKIP_PARTS = ("node_modules/", ".next/", "graphify-out/", ".git/")
SKIP_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".ico",
            ".woff", ".woff2", ".ttf", ".zip", ".mp4", ".mp3", ".ulf")

SECRET_NAME = r"(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|REFRESH[_-]?TOKEN|CLIENT[_-]?SECRET|SECRET|PASSWORD|PASSWD|PRIVATE[_-]?KEY|CREDENTIAL|LICENSE)"

# 값이 아니라 참조·자리표시자인 것들. 이게 있으면 4번 규칙에서 뺀다.
PLACEHOLDER = re.compile(
    r"process\.env|os\.environ|getenv|\$\{\{|\$\{?[A-Z_]+\}?|"
    r"<[^>]*>|여기에|your[_-]|example|placeholder|dummy|sample|xxx+|\.\.\.|"
    r"changeme|redacted|REPLACE", re.I)

RULES = [
    ("알려진 토큰 접두사",
     re.compile(r"\b(?:sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|"
                r"github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{12,}|"
                r"xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_\-]{30,})")),
    ("개인키 블록",
     re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("Bearer 뒤 긴 리터럴",
     re.compile(r"Bearer\s+(?![\$\{<])[A-Za-z0-9._\-]{24,}")),
]

# 4. 시크릿 이름 = 긴 리터럴
ASSIGN = re.compile(
    SECRET_NAME + r"[A-Z_]*\s*[:=]\s*[\"'`]([^\"'`\n]{20,})[\"'`]", re.I)

# 5. 시크릿 환경변수를 출력으로 흘림
LOGGING = re.compile(r"console\.(?:log|error|warn|info)|\bprint\s*\(|"
                     r"^\s*(?:echo|printf)\b", re.M)
ENV_REF = re.compile(r"process\.env\.[A-Z_]*" + SECRET_NAME + r"[A-Z_]*|"
                     r"\$\{?[A-Z_]*" + SECRET_NAME + r"[A-Z_]*\}?", re.I)
# 길이·불리언 같은 파생 정보만 찍는 형태는 의도된 진단이라 뺀다.
DERIVED = re.compile(r"\$\{#|\.length|len\(|wc\s+-[cml]|Boolean\(|!!|"
                     r"\?\s*[\"']yes|설정됨|길이|줄 수")


def looks_random(s: str) -> bool:
    """글자와 숫자가 섞여 있어야 값으로 본다. 문장·경로는 뺀다."""
    if " " in s or "/" in s and "." in s:
        return False
    return bool(re.search(r"[A-Za-z]", s)) and bool(re.search(r"\d", s))


def scan(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().split("\n")
    except (OSError, UnicodeDecodeError):
        return []

    out = []
    for n, line in enumerate(lines, 1):
        for why, pat in RULES:
            if pat.search(line):
                out.append((n, why))

        m = ASSIGN.search(line)
        if m and not PLACEHOLDER.search(line) and looks_random(m.group(1)):
            out.append((n, "시크릿 이름에 긴 문자열이 직접 들어 있다"))

        if LOGGING.search(line) and ENV_REF.search(line) and not DERIVED.search(line):
            out.append((n, "시크릿 환경변수가 출력으로 나간다"))
    return out


def changed_files(repo: str):
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
        if not name or name.endswith("/"):
            continue
        if os.path.basename(name) in SKIP_NAMES:
            continue
        if any(p in name for p in SKIP_PARTS):
            continue
        if name.lower().endswith(SKIP_EXT):
            continue
        files.append(os.path.join(repo, name))
    return files


def main():
    try:
        json.load(sys.stdin)
    except Exception:
        pass

    repos = [os.getcwd()]
    if os.path.isdir("/workspace/lord-of-dark"):
        repos.append("/workspace/lord-of-dark")

    found = []
    for repo in repos:
        for path in changed_files(repo):
            for n, why in scan(path):
                found.append(f"{path}:{n} — {why}")

    if not found:
        return 0

    print("시크릿으로 보이는 값이 변경분에 있다. 커밋 전에 확인한다.",
          file=sys.stderr)
    print("값은 환경변수로 빼고, 진단이 필요하면 길이·불리언 같은 "
          "되돌릴 수 없는 파생 정보만 찍는다.", file=sys.stderr)
    for line in found[:20]:
        print("  " + line, file=sys.stderr)
    if len(found) > 20:
        print(f"  … 외 {len(found) - 20}건", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
